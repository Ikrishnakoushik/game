import 'package:flutter_test/flutter_test.dart';
import 'package:karma_coins/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const KarmaCoinsApp());
    expect(find.text('KarmaCoins'), findsOneWidget);
  });
}
