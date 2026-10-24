import 'dart:io';

import 'package:dart_frog/dart_frog.dart';

const _allowHeaders = 'Authorization, Content-Type';
const _allowMethods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

/// CORS cho trình duyệt gọi thẳng server (Flutter web): chỉ origin trong [allowedOrigins].
/// App iOS / Android và server Next.js không cần CORS.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Middleware corsMiddleware(Set<String> Function() allowedOrigins) {
  return (handler) {
    return (context) async {
      final origin = context.request.headers['Origin'];
      final isAllowed = origin != null && allowedOrigins().contains(origin);
      final headers = isAllowed
          ? {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Headers': _allowHeaders,
              'Access-Control-Allow-Methods': _allowMethods,
              'Vary': 'Origin',
            }
          : const <String, String>{};
      if (context.request.method == HttpMethod.options) {
        return Response(statusCode: HttpStatus.noContent, headers: headers);
      }
      final response = await handler(context);
      return response.copyWith(headers: {...response.headers, ...headers});
    };
  };
}
