
#include "hookapi.h"
#include <stdint.h>

#define UNIX_TIMESTAMP_OFFSET 946684800
#define DAY_IN_SECONDS 86400

//ERRORS
#define LAST_CLOSED_LEDGER_BUFF 10
#define ERROR_URITOKEN_OCCUPIED 20
#define ERROR_INVALID_TX_PARAMS 1
#define ERROR_MISSING_HOOK_PARAM 2
#define ERROR_MISSING_DESTINATION_ACC 3
#define INTERNAL_HOOK_STATE_MUTATION_ERROR 4

int64_t hook(uint32_t ctx) {

    uint8_t TX_PARAM_RENTAL_DEADLINE_NAME[] = {'R', 'E', 'N', 'T', 'A', 'L', 'D', 'E', 'A', 'D', 'L', 'I', 'N', 'E'};
    uint8_t TX_PARAM_RENTAL_AMOUNT_NAME[] = {'R', 'E', 'N', 'T', 'A', 'L', 'A', 'M', 'O', 'U', 'N', 'T'};
    uint32_t RENTAL_IN_PROGRESS_AMOUNT_KEY[] = {112};

    //reading from the state number of ongoing rentals on the account
    uint32_t NUM_OF_RENTALS[1];
    int64_t NUM_OF_RENTALS_LOOKUP = state(SBUF(NUM_OF_RENTALS), SBUF(RENTAL_IN_PROGRESS_AMOUNT_KEY));
    //reading a URIToken id from incoming/outgoing transaction
    uint8_t URITOKEN_TX_VALUE[32];
    int64_t URITOKEN_TX_LOOKUP = otxn_field((uint32_t) (uintptr_t) URITOKEN_TX_VALUE, 32, sfURITokenID);
    //reading from the state value URITOKEN_TX_VALUE -> deadline_timestamp (value present only if token is in ongoing rental proces)
    int8_t URITOKEN_STORE_VALUE[34];
    int64_t URITOKEN_STORE_LOOKUP = state(SBUF(URITOKEN_STORE_VALUE), SBUF(URITOKEN_TX_VALUE));
    //converting timestamp buffer to a float number
    int64_t RENTAL_DEADLINE_TS_VALUE = float_int(*((int64_t *) URITOKEN_STORE_VALUE), 0, 1);
    //reading current transaction type
    int64_t TX_TYPE = otxn_type();
    //reading ledger last time with additional constant offset to be the same as on linux
    int64_t LEDGER_LAST_TIME_TS = ledger_last_time() + UNIX_TIMESTAMP_OFFSET;
    //reading a deadline value passed as a hook parameter
    uint8_t otxn_param_value_deadline[8];
    int64_t otxn_param_value_deadline_lookup = otxn_param(SBUF(otxn_param_value_deadline),
                                                          SBUF(TX_PARAM_RENTAL_DEADLINE_NAME));
    TRACEHEX(otxn_param_value_deadline);
    //converting the deadline timestamp value to a float number
    int64_t otxn_deadline_value = float_int(*((int64_t *) otxn_param_value_deadline), 0, 1);
    TRACEVAR(otxn_deadline_value);

    //reading originating account
    uint8_t otx_acc[20];
    otxn_field(SBUF(otx_acc), sfAccount);

    //reading hook account
    uint8_t hook_acc[20];
    hook_account(SBUF(hook_acc));
    //setting a flag whether the transaction is outgoing or incoming
    int is_tx_outgoing = 0;
    BUFFER_EQUAL(is_tx_outgoing, hook_acc, otx_acc, 20);
    //prevent from canceling the return offer for rented token
    if (TX_TYPE == ttURITOKEN_CANCEL_SELL_OFFER && URITOKEN_STORE_LOOKUP > 0) {
        rollback(SBUF("[ONGOING RENTALS]: Return offers waits for owner to be accepted"), 10);
    }
    //prevent from burning the currently rented token
    if (TX_TYPE == ttURITOKEN_BURN && URITOKEN_STORE_LOOKUP > 0) {
        rollback(SBUF("[ONGOING RENTALS]: Cannot burn URIToken which is in ongoing rental process"), 10);
    }
    //cannot mutate Hook or delete account if there are ongoing rentals
    if (TX_TYPE == ttACCOUNT_DELETE || TX_TYPE == ttHOOK_SET) {
        if (NUM_OF_RENTALS[0] > 0) {
            rollback(SBUF("[ONGOING RENTALS]: cannot mutate hook, delete account or burn rented token"), 10);
        }
        accept(SBUF("Tx accepted"), (uint64_t) (uintptr_t) 0);
    }

    if (TX_TYPE == ttURITOKEN_BUY) {
        //check if token is present in a store
        if (URITOKEN_STORE_LOOKUP > 0) {
            //remove the token from the store by assigning 0s to value under the key URITokenID
            if (state_set(0, 0, SBUF(URITOKEN_TX_VALUE)) < 0) {
                //rollback transaction if removal of a token has failed
                rollback(SBUF("[INTERNAL HOOK STATE ERROR]:  Could not remove the URIToken from the state"),
                         INTERNAL_HOOK_STATE_MUTATION_ERROR);
            } else {
                TRACESTR("URIToken removed from the store");
            }
            //reduce number of rentals
            NUM_OF_RENTALS[0]--;
            //saving the reduced number of rentals in the store
            if (state_set(SBUF(NUM_OF_RENTALS), SBUF(RENTAL_IN_PROGRESS_AMOUNT_KEY)) < 0) {
                //if saving failed then rollback the transaction
                rollback(SBUF("[INTERNAL HOOK STATE ERROR]: Could not decrement number of rentals in state"),
                         INTERNAL_HOOK_STATE_MUTATION_ERROR);
            } else {
                accept(SBUF("Finish of rental process. Num of rentals decremented, Tx accepted"),
                       (uint64_t) (uintptr_t) 0);
            }
            _g(1, 1);
            return 0;
        } else {
            //saving the rental deadline for a token under key URITokenID (URITOKEN_TX_VALUE -> deadline)
            if(otxn_param_value_deadline_lookup <= 0 || otxn_deadline_value <= 0) {
                rollback(SBUF("[INVALID PARAMS]: rental deadline must be given"), 10);
            }
            int64_t savedURITokenLength = state_set(SBUF(otxn_param_value_deadline), SBUF(URITOKEN_TX_VALUE));
            if (savedURITokenLength < 0) {
                //if saving failed then rollback
                rollback(SBUF("[INTERNAL HOOK STATE ERROR]: URIToken save failure"), 1);
            } else {
                //increment number of rentals or assign 1 if first token rental occurred
                if (NUM_OF_RENTALS_LOOKUP < 0) {
                    NUM_OF_RENTALS[0] = 1;
                } else {
                    NUM_OF_RENTALS[0]++;
                }
                //saving the number of
                if (state_set(SBUF(NUM_OF_RENTALS), SBUF(RENTAL_IN_PROGRESS_AMOUNT_KEY)) < 0) {
                    rollback(SBUF("[TX REJECTED]: Could not mutate num of rentals value"), 1);
                }
                accept(SBUF("New NFTokenID saved to the store, Tx accepted"), (uint64_t) (uintptr_t) 0);
            }
            _g(1, 1);
            return 0;
        }
    }
    //reading rental amount from as a hook parameter
    uint8_t otxn_param_value_amount[8];
    int64_t otxn_param_value_amount_lookup = otxn_param(SBUF(otxn_param_value_amount),
                                                        SBUF(TX_PARAM_RENTAL_AMOUNT_NAME));
    //converting the buffer to float number
    uint64_t otxn_amount_value = float_int(*((int64_t *) otxn_param_value_amount), 6, 1);
    //checking if deadline parameter is present
    int DEADLINE_TIME_PRESENT = otxn_param_value_deadline_lookup > 0 && otxn_deadline_value > 0;
    //checking if amount parameter is present
    int RENTAL_TOTAL_AMOUNT_PRESENT = otxn_param_value_amount_lookup > 0 != 0 && otxn_amount_value > 0;
    //check if rental context is vali
    if (!DEADLINE_TIME_PRESENT || !RENTAL_TOTAL_AMOUNT_PRESENT) {
        if (URITOKEN_STORE_LOOKUP > 0) {
            //rollback transaction if URITokenID is present in the store (malicious activity)
            rollback(SBUF("[ONGOING RENTALS]: URIToken is already in ongoing rental process"), ERROR_URITOKEN_OCCUPIED);
        } else {
            //accepting transaction treating it as a non-rental tx
            accept(SBUF("[TX ACCEPTED]: Non-rental tx accepted"), (uint64_t) (uintptr_t) 0);
        }
    } else {
        uint8_t foreignRenterURIToken[32];
        int64_t foreignRenterURIToken_lookup = -1;

        //reading foreign account (lender/renter) namespace from hook parameter
        uint8_t foreignAccountNS[32];
        uint8_t ns_param_name[] = {'F', 'O', 'R', 'E', 'I', 'G', 'N', 'N', 'S'};
        int64_t foreignRenterAccountNamespace_lookup = otxn_param(SBUF(foreignAccountNS), SBUF(ns_param_name));
        //reading foreign account address (lender/renter) from hook parameter
        uint8_t foreignAcc[20];
        uint8_t account_param_name[] = {'F', 'O', 'R', 'E', 'I', 'G', 'N', 'A', 'C', 'C'};
        int64_t renterAccountId_lookup = otxn_param(SBUF(foreignAcc), SBUF(account_param_name));
        //rollback if any of param is missing and URIToken is in rental
        if ((foreignRenterAccountNamespace_lookup < 0 || renterAccountId_lookup < 0) &&
            URITOKEN_STORE_LOOKUP > 0) {
            rollback(SBUF("[TX REJECTED]: Hook parameter (renterNS or renterAccId) missing"),
                     ERROR_MISSING_HOOK_PARAM);
        }
        //reading Destination address of transaction (required)
        uint8_t SELL_OFFER_DESTINATION_ACC[20];
        int64_t SELL_OFFER_DESTINATION_ACC_LOOKUP = otxn_field(SBUF(SELL_OFFER_DESTINATION_ACC), sfDestination);
        //rollback if missing
        if (SELL_OFFER_DESTINATION_ACC_LOOKUP < 0) {
            rollback(SBUF("[TX REJECTED]: URITokenCreateSellOffer tx is not complete: missing Destination"),
                     ERROR_MISSING_DESTINATION_ACC);
        }
        //reading foreign state of hook state to which was granted access through HookGrant
        //in case of creating a return offer Bob checks if Alice has the URITokenID key present in her store
        foreignRenterURIToken_lookup = state_foreign(SBUF(foreignRenterURIToken), SBUF(URITOKEN_TX_VALUE),
                                                     SBUF(foreignAccountNS),
                                                     SBUF(foreignAcc));
        //assignment of minimal deadline which must be at least to the next day
        int64_t MIN_DEADLINE_TIMESTAMP = LEDGER_LAST_TIME_TS + LAST_CLOSED_LEDGER_BUFF + DAY_IN_SECONDS;
        //two conditions checked: (1. invalid deadline for start offer), (2. invalid deadline for return offer)
        if ((otxn_deadline_value < MIN_DEADLINE_TIMESTAMP && foreignRenterURIToken_lookup < 0) ||
            (URITOKEN_STORE_LOOKUP > 0 && RENTAL_DEADLINE_TS_VALUE != otxn_deadline_value &&
             foreignRenterURIToken_lookup > 0 && is_tx_outgoing)) {
            rollback(SBUF("[TX REJECTED]: Invalid rental deadline"), ERROR_INVALID_TX_PARAMS);
        }
        //reading Amount value from transaction
        uint8_t otxn_field_amount_value[8];
        int64_t otxn_field_amount_lookup = otxn_field(otxn_field_amount_value, 8, sfAmount);
        //converting it to drops
        uint64_t otxn_field_amount_drops = AMOUNT_TO_DROPS(otxn_field_amount_value);
        //two conditions checked: (1. start rental - amount bigger than 0), (2. return offer - amount must be 0)
        if ((otxn_field_amount_drops <= 0 && foreignRenterURIToken_lookup < 0) ||
            (otxn_field_amount_drops != 0 && foreignRenterURIToken_lookup > 0 && is_tx_outgoing)) {
            rollback(SBUF("[TX REJECTED]: Invalid rental total amount"), ERROR_INVALID_TX_PARAMS);
        }

        if (URITOKEN_STORE_LOOKUP > 0) {
            if (foreignRenterURIToken_lookup <= 0) {
                rollback(SBUF("[ONGOING RENTALS]: URIToken is already in ongoing rental process"),
                         ERROR_URITOKEN_OCCUPIED);
            } else {
                if (RENTAL_DEADLINE_TS_VALUE > LEDGER_LAST_TIME_TS + LAST_CLOSED_LEDGER_BUFF) {
                    rollback(SBUF("[ONGOING RENTALS]: URIToken is already in ongoing rental process"),
                             ERROR_URITOKEN_OCCUPIED);
                }
            }
        } else {
            accept(SBUF("[TX ACCEPTED]: URIToken rental start offer accepted"), 0);
        }
    }
    accept(SBUF("Tx accepted"), (uint64_t) (uintptr_t) 0);
    _g(1, 1);
    return 0;
}