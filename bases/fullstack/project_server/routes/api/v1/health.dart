import 'package:dart_frog/dart_frog.dart';
import 'package:postgres/postgres.dart';
import 'package:server/core/utils/request_body.dart';

/// `GET /api/v1/health` — server sống và kết nối được database (Docker / Nginx kiểm tra).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Response> onRequest(RequestContext context) async {
  requireMethod(context, HttpMethod.get);
  await context.read<Pool<void>>().execute('SELECT 1');
  return Response.json(body: {'status': 'ok'});
}
