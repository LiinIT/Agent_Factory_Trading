// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'api_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Kho token dùng chung toàn app (thay bản trong bộ nhớ khi test).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

@ProviderFor(tokenStorage)
final tokenStorageProvider = TokenStorageProvider._();

/// Kho token dùng chung toàn app (thay bản trong bộ nhớ khi test).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

final class TokenStorageProvider
    extends $FunctionalProvider<TokenStorage, TokenStorage, TokenStorage>
    with $Provider<TokenStorage> {
  /// Kho token dùng chung toàn app (thay bản trong bộ nhớ khi test).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  TokenStorageProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'tokenStorageProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$tokenStorageHash();

  @$internal
  @override
  $ProviderElement<TokenStorage> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  TokenStorage create(Ref ref) {
    return tokenStorage(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(TokenStorage value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<TokenStorage>(value),
    );
  }
}

String _$tokenStorageHash() => r'a42816fb1cf5af728e44ff5c48bfcaf5dc6b12aa';

/// ApiClient dùng chung, giữ một kết nối HTTP và đóng khi provider huỷ.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

@ProviderFor(apiClient)
final apiClientProvider = ApiClientProvider._();

/// ApiClient dùng chung, giữ một kết nối HTTP và đóng khi provider huỷ.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

final class ApiClientProvider
    extends $FunctionalProvider<ApiClient, ApiClient, ApiClient>
    with $Provider<ApiClient> {
  /// ApiClient dùng chung, giữ một kết nối HTTP và đóng khi provider huỷ.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  ApiClientProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'apiClientProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$apiClientHash();

  @$internal
  @override
  $ProviderElement<ApiClient> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ApiClient create(Ref ref) {
    return apiClient(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ApiClient value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ApiClient>(value),
    );
  }
}

String _$apiClientHash() => r'1f49c2f5d5c295a92ebaf0bbdcbcf7a59b4b4800';
