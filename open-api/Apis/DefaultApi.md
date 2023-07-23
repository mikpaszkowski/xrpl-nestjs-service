# DefaultApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**accountControllerAccountInfo**](DefaultApi.md#accountControllerAccountInfo) | **GET** /account/{num}/info |  |
| [**accountControllerAccountNamespace**](DefaultApi.md#accountControllerAccountNamespace) | **GET** /account/{num}/namespace/{namespace} |  |
| [**appControllerGetHello**](DefaultApi.md#appControllerGetHello) | **GET** / |  |
| [**hookControllerAccountHooks**](DefaultApi.md#hookControllerAccountHooks) | **GET** /hook/{address} |  |
| [**hookControllerDeleteHook**](DefaultApi.md#hookControllerDeleteHook) | **DELETE** /hook |  |
| [**hookControllerDeployHook**](DefaultApi.md#hookControllerDeployHook) | **POST** /hook |  |
| [**hookControllerResetHook**](DefaultApi.md#hookControllerResetHook) | **PUT** /hook/reset |  |
| [**rentalsControllerAcceptRentalOffer**](DefaultApi.md#rentalsControllerAcceptRentalOffer) | **POST** /rentals/start-offers/{index}/accept |  |
| [**rentalsControllerAcceptReturnRentalOffer**](DefaultApi.md#rentalsControllerAcceptReturnRentalOffer) | **POST** /rentals/return-offer/{index}/accept |  |
| [**rentalsControllerCancelOffer**](DefaultApi.md#rentalsControllerCancelOffer) | **DELETE** /rentals/offers/{index} |  |
| [**rentalsControllerCreateLendOffer**](DefaultApi.md#rentalsControllerCreateLendOffer) | **POST** /rentals/offers |  |
| [**uriTokenControllerGetURITokens**](DefaultApi.md#uriTokenControllerGetURITokens) | **GET** /uri-tokens/{address} |  |
| [**uriTokenControllerMintURIToken**](DefaultApi.md#uriTokenControllerMintURIToken) | **POST** /uri-tokens/mint |  |


<a name="accountControllerAccountInfo"></a>
# **accountControllerAccountInfo**
> AccountInfoOutputDto accountControllerAccountInfo(num)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **num** | **String**|  | [default to null] |

### Return type

[**AccountInfoOutputDto**](../Models/AccountInfoOutputDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="accountControllerAccountNamespace"></a>
# **accountControllerAccountNamespace**
> Object accountControllerAccountNamespace(num, namespace)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **num** | **String**|  | [default to null] |
| **namespace** | **String**|  | [default to null] |

### Return type

**Object**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="appControllerGetHello"></a>
# **appControllerGetHello**
> String appControllerGetHello()



### Parameters
This endpoint does not need any parameter.

### Return type

**String**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="hookControllerAccountHooks"></a>
# **hookControllerAccountHooks**
> List hookControllerAccountHooks(address)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **address** | **String**|  | [default to null] |

### Return type

**List**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="hookControllerDeleteHook"></a>
# **hookControllerDeleteHook**
> hookControllerDeleteHook(HookInputDTO)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **HookInputDTO** | [**HookInputDTO**](../Models/HookInputDTO.md)|  | |

### Return type

null (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

<a name="hookControllerDeployHook"></a>
# **hookControllerDeployHook**
> HookInstallOutputDTO hookControllerDeployHook(HookInputDTO)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **HookInputDTO** | [**HookInputDTO**](../Models/HookInputDTO.md)|  | |

### Return type

[**HookInstallOutputDTO**](../Models/HookInstallOutputDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="hookControllerResetHook"></a>
# **hookControllerResetHook**
> hookControllerResetHook(HookInputDTO)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **HookInputDTO** | [**HookInputDTO**](../Models/HookInputDTO.md)|  | |

### Return type

null (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

<a name="rentalsControllerAcceptRentalOffer"></a>
# **rentalsControllerAcceptRentalOffer**
> XRPLBaseResponse rentalsControllerAcceptRentalOffer(index, AcceptRentalOffer)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **index** | **String**|  | [default to null] |
| **AcceptRentalOffer** | [**AcceptRentalOffer**](../Models/AcceptRentalOffer.md)|  | |

### Return type

[**XRPLBaseResponse**](../Models/XRPLBaseResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="rentalsControllerAcceptReturnRentalOffer"></a>
# **rentalsControllerAcceptReturnRentalOffer**
> XRPLBaseResponse rentalsControllerAcceptReturnRentalOffer(index, AcceptRentalOffer)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **index** | **String**|  | [default to null] |
| **AcceptRentalOffer** | [**AcceptRentalOffer**](../Models/AcceptRentalOffer.md)|  | |

### Return type

[**XRPLBaseResponse**](../Models/XRPLBaseResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="rentalsControllerCancelOffer"></a>
# **rentalsControllerCancelOffer**
> XRPLBaseResponse rentalsControllerCancelOffer(index, CancelRentalOfferDTO)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **index** | **String**|  | [default to null] |
| **CancelRentalOfferDTO** | [**CancelRentalOfferDTO**](../Models/CancelRentalOfferDTO.md)|  | |

### Return type

[**XRPLBaseResponse**](../Models/XRPLBaseResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="rentalsControllerCreateLendOffer"></a>
# **rentalsControllerCreateLendOffer**
> XRPLBaseResponse rentalsControllerCreateLendOffer(type, URITokenInputDTO)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **type** | **String**|  | [default to null] |
| **URITokenInputDTO** | [**URITokenInputDTO**](../Models/URITokenInputDTO.md)|  | |

### Return type

[**XRPLBaseResponse**](../Models/XRPLBaseResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="uriTokenControllerGetURITokens"></a>
# **uriTokenControllerGetURITokens**
> List uriTokenControllerGetURITokens(address)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **address** | **String**|  | [default to null] |

### Return type

[**List**](../Models/URITokenOutputDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="uriTokenControllerMintURIToken"></a>
# **uriTokenControllerMintURIToken**
> XRPLBaseResponse uriTokenControllerMintURIToken(MintURITokenInputDTO)



### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **MintURITokenInputDTO** | [**MintURITokenInputDTO**](../Models/MintURITokenInputDTO.md)|  | |

### Return type

[**XRPLBaseResponse**](../Models/XRPLBaseResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

