import 'package:flutter_test/flutter_test.dart';
import 'package:habitcoins/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HabitCoinsApp());
    expect(find.text('HabitCoins'), findsOneWidget);
  });
}
