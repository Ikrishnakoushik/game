import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/landing_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/main_app.dart';
import 'theme/colors.dart';
import 'services/secure_storage.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const KarmaCoinsApp());
}

class KarmaCoinsApp extends StatelessWidget {
  const KarmaCoinsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KarmaCoins',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Poppins',
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.purple),
        useMaterial3: true,
      ),
      home: const AppRouter(),
    );
  }
}

class AppRouter extends StatefulWidget {
  const AppRouter({super.key});

  @override
  State<AppRouter> createState() => _AppRouterState();
}

class _AppRouterState extends State<AppRouter> {
  String _page = 'landing';
  Map<String, dynamic>? _user;

  void _onGetStarted() => setState(() => _page = 'auth');

  void _onAuthComplete(Map<String, dynamic> user) {
    setState(() {
      _user = user;
      _page = 'app';
    });
  }

  Future<void> _onLogout() async {
    await SecureStorage.clearAll(); // wipe token from OS keychain
    setState(() {
      _user = null;
      _page = 'landing';
    });
  }

  @override
  Widget build(BuildContext context) {
    switch (_page) {
      case 'auth':
        return AuthScreen(onAuthComplete: _onAuthComplete);
      case 'app':
        return MainApp(user: _user!, onLogout: _onLogout);
      default:
        return LandingScreen(onGetStarted: _onGetStarted);
    }
  }
}
