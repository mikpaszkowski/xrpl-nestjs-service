import { XRPLBaseResponseDTO } from '../uriToken/dto/uri-token-output.dto';

export function mapXRPLBaseResponseToDto(result: any): XRPLBaseResponseDTO {
  return {
    tx_hash: result.response.tx_json.hash,
    result: result.response.engine_result,
  };
}
