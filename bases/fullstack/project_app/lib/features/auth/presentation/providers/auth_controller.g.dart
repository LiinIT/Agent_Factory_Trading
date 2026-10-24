// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Cung cấp AuthDatasource (thay bản giả trong test qua override).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

@ProviderFor(authDatasource)
final authDatasourceProvider = AuthDatasourceProvider._();

/// Cung cấp AuthDatasource (thay bản giả trong test qua override).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

final class AuthDatasourceProvider
    extends $FunctionalProvider<AuthDatasource, AuthDatasource, AuthDatasource>
    with $Provider<AuthDatasource> {
  /// Cung cấp AuthDatasource (thay bản giả trong test qua override).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  AuthDatasourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authDatasourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authDatasourceHash();

  @$internal
  @override
  $ProviderElement<AuthDatasource> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  AuthDatasource create(Ref ref) {
    return authDatasource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AuthDatasource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AuthDatasource>(value),
    );
  }
}

String _$authDatasourceHash() => r'67c5ea109fcc86f67f9d74542f13141ebb1c9fe2';

/// Controller phiên đăng nhập: state là người dùng hiện tại, null = chưa đăng nhập.
/// Điều phối datasource (API) và TokenStorage (lưu token trên máy).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

@ProviderFor(AuthController)
final authControllerProvider = AuthControllerProvider._();

/// Controller phiên đăng nhập: state là người dùng hiện tại, null = chưa đăng nhập.
/// Điều phối datasource (API) và TokenStorage (lưu token trên máy).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
final class AuthControllerProvider
    extends $AsyncNotifierProvider<AuthController, User?> {
  /// Controller phiên đăng nhập: state là người dùng hiện tại, null = chưa đăng nhập.
  /// Điều phối datasource (API) và TokenStorage (lưu token trên máy).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  AuthControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authControllerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authControllerHash();

  @$internal
  @override
  AuthController create() => AuthController();
}

String _$authControllerHash() => r'c185a18cc245fb3bde46d06fbc03b6d04ac9c65a';

/// Controller phiên đăng nhập: state là người dùng hiện tại, null = chưa đăng nhập.
/// Điều phối datasource (API) và TokenStorage (lưu token trên máy).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20

abstract class _$AuthController extends $AsyncNotifier<User?> {
  FutureOr<User?> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<User?>, User?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<User?>, User?>,
              AsyncValue<User?>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
