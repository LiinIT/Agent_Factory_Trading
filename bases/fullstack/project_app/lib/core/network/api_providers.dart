import 'package:http/http.dart' as http;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:app/core/services/token_storage.dart';
import 'package:app/core/network/api_client.dart';

part 'api_providers.g.dart';

/// Kho token dùng chung toàn app (thay bản trong bộ nhớ khi test).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
@Riverpod(keepAlive: true)
TokenStorage tokenStorage(Ref ref) => TokenStorage();

/// ApiClient dùng chung, giữ một kết nối HTTP và đóng khi provider huỷ.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
@Riverpod(keepAlive: true)
ApiClient apiClient(Ref ref) {
  final httpClient = http.Client();
  ref.onDispose(httpClient.close);
  return ApiClient(
    httpClient: httpClient,
    tokenStorage: ref.watch(tokenStorageProvider),
  );
}
