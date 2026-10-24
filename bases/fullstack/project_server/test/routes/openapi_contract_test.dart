import 'dart:io';

import 'package:test/test.dart';
import 'package:yaml/yaml.dart';

const _routesRoot = 'routes/api/v1';

/// Đường dẫn API của một file route: bỏ `index`, đổi `[id]` thành `{id}`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
String _pathOf(String file) {
  final relative = file.substring(_routesRoot.length).replaceAll('.dart', '');
  final withoutIndex = relative.endsWith('/index')
      ? relative.substring(0, relative.length - '/index'.length)
      : relative;
  return withoutIndex.replaceAllMapped(
    RegExp(r'\[(\w+)\]'),
    (match) => '{${match[1]}}',
  );
}

/// openapi.yaml và thư mục routes/ phải khớp nhau — web / app dựa vào contract này.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
void main() {
  test('mỗi route có trong openapi.yaml và ngược lại', () {
    final routeFiles = Directory(_routesRoot)
        .listSync(recursive: true)
        .whereType<File>()
        .map((file) => file.path)
        .where(
          (path) =>
              path.endsWith('.dart') && !path.endsWith('_middleware.dart'),
        );
    final routePaths = routeFiles.map(_pathOf).toSet();
    final spec = loadYaml(File('openapi.yaml').readAsStringSync()) as YamlMap;
    final specPaths = (spec['paths'] as YamlMap).keys.cast<String>().toSet();

    expect(
      routePaths.difference(specPaths),
      isEmpty,
      reason: 'route chưa khai trong openapi.yaml',
    );
    expect(
      specPaths.difference(routePaths),
      isEmpty,
      reason: 'openapi.yaml khai route không có',
    );
  });
}
