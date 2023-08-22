export function mapXRPLBaseResponseToDto(result: any) {
  return {
    tx_hash: result.response.tx_json.hash,
    result: result.response.engine_result,
  };
}
