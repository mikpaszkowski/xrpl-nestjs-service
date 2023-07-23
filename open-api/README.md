# Documentation for XRPL Token Rental Service

<a name="documentation-for-api-endpoints"></a>
## Documentation for API Endpoints

All URIs are relative to *http://localhost*

| Class | Method | HTTP request | Description |
|------------ | ------------- | ------------- | -------------|
| *DefaultApi* | [**accountControllerAccountInfo**](Apis/DefaultApi.md#accountcontrolleraccountinfo) | **GET** /account/{num}/info |  |
*DefaultApi* | [**accountControllerAccountNamespace**](Apis/DefaultApi.md#accountcontrolleraccountnamespace) | **GET** /account/{num}/namespace/{namespace} |  |
*DefaultApi* | [**appControllerGetHello**](Apis/DefaultApi.md#appcontrollergethello) | **GET** / |  |
*DefaultApi* | [**hookControllerAccountHooks**](Apis/DefaultApi.md#hookcontrolleraccounthooks) | **GET** /hook/{address} |  |
*DefaultApi* | [**hookControllerDeleteHook**](Apis/DefaultApi.md#hookcontrollerdeletehook) | **DELETE** /hook |  |
*DefaultApi* | [**hookControllerDeployHook**](Apis/DefaultApi.md#hookcontrollerdeployhook) | **POST** /hook |  |
*DefaultApi* | [**hookControllerResetHook**](Apis/DefaultApi.md#hookcontrollerresethook) | **PUT** /hook/reset |  |
*DefaultApi* | [**rentalsControllerAcceptRentalOffer**](Apis/DefaultApi.md#rentalscontrolleracceptrentaloffer) | **POST** /rentals/start-offers/{index}/accept |  |
*DefaultApi* | [**rentalsControllerAcceptReturnRentalOffer**](Apis/DefaultApi.md#rentalscontrolleracceptreturnrentaloffer) | **POST** /rentals/return-offer/{index}/accept |  |
*DefaultApi* | [**rentalsControllerCancelOffer**](Apis/DefaultApi.md#rentalscontrollercanceloffer) | **DELETE** /rentals/offers/{index} |  |
*DefaultApi* | [**rentalsControllerCreateLendOffer**](Apis/DefaultApi.md#rentalscontrollercreatelendoffer) | **POST** /rentals/offers |  |
*DefaultApi* | [**uriTokenControllerGetURITokens**](Apis/DefaultApi.md#uritokencontrollergeturitokens) | **GET** /uri-tokens/{address} |  |
*DefaultApi* | [**uriTokenControllerMintURIToken**](Apis/DefaultApi.md#uritokencontrollerminturitoken) | **POST** /uri-tokens/mint |  |


<a name="documentation-for-models"></a>
## Documentation for Models

 - [AcceptRentalOffer](./Models/AcceptRentalOffer.md)
 - [Account](./Models/Account.md)
 - [AccountInfoOutputDto](./Models/AccountInfoOutputDto.md)
 - [CancelRentalOfferDTO](./Models/CancelRentalOfferDTO.md)
 - [HookInputDTO](./Models/HookInputDTO.md)
 - [HookInstallOutputDTO](./Models/HookInstallOutputDTO.md)
 - [MintURITokenInputDTO](./Models/MintURITokenInputDTO.md)
 - [URITokenInputDTO](./Models/URITokenInputDTO.md)
 - [URITokenOutputDTO](./Models/URITokenOutputDTO.md)
 - [XRPLBaseResponse](./Models/XRPLBaseResponse.md)


<a name="documentation-for-authorization"></a>
## Documentation for Authorization

All endpoints do not require authorization.
