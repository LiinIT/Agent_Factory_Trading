import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/app_logger.dart';
import 'package:server/core/utils/request_body.dart';
import 'package:server/features/users/data/datasources/users_datasource.dart';

const _defaultPageSize = 20;
const _maxPageSize = 100;

/// `GET /api/v1/admin/users?page=&pageSize=` — danh sách thành viên (ADMIN).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Response> onRequest(RequestContext context) async {
  requireMethod(context, HttpMethod.get);
  final query = context.request.uri.queryParameters;
  final page = int.tryParse(query['page'] ?? '1');
  final pageSize = int.tryParse(query['pageSize'] ?? '$_defaultPageSize');
  if (page == null ||
      page < 1 ||
      pageSize == null ||
      pageSize < 1 ||
      pageSize > _maxPageSize) {
    throw ApiError.badRequest([
      'page là số nguyên ≥ 1, pageSize từ 1 đến $_maxPageSize',
    ]);
  }
  final result = await context.read<UsersDatasource>().list(
    offset: (page - 1) * pageSize,
    limit: pageSize,
  );
  appLogger.d('[AdminUsers] list page=$page total=${result.total}');
  return Response.json(
    body: {
      'items': result.items.map((user) => user.toPublicJson()).toList(),
      'total': result.total,
      'page': page,
      'pageSize': pageSize,
    },
  );
}
