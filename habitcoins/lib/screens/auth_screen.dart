import 'package:flutter/material.dart';
import '../theme/colors.dart';

class AuthScreen extends StatefulWidget {
  final void Function(Map<String, dynamic> user) onAuthComplete;

  const AuthScreen({super.key, required this.onAuthComplete});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = false;
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  void _submit() {
    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text.trim();
    final name = _nameCtrl.text.trim();

    if (_isLogin && email.isNotEmpty && password.isNotEmpty) {
      widget.onAuthComplete({'name': 'Ravi Kumar', 'email': email, 'avatar': 'RK'});
    } else if (!_isLogin && name.isNotEmpty && email.isNotEmpty && password.isNotEmpty) {
      final initials = name.split(' ').map((w) => w.isNotEmpty ? w[0] : '').join().toUpperCase();
      widget.onAuthComplete({'name': name, 'email': email, 'avatar': initials});
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),
              const Text('🪙', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 16),
              Text(
                _isLogin ? 'Welcome back' : 'Join HabitCoins',
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textDark),
              ),
              const SizedBox(height: 6),
              Text(
                _isLogin ? 'Sign in to your account' : 'Start building better habits',
                style: const TextStyle(fontSize: 14, color: AppColors.muted),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!_isLogin) ...[
                      _label('Full name'),
                      _field(_nameCtrl, 'Ravi Kumar', TextInputType.name),
                      const SizedBox(height: 16),
                    ],
                    _label('Email'),
                    _field(_emailCtrl, 'you@example.com', TextInputType.emailAddress),
                    const SizedBox(height: 16),
                    _label('Password'),
                    _field(_passCtrl, '••••••••', TextInputType.visiblePassword, obscure: true),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.purple,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: Text(
                          _isLogin ? 'Sign in' : 'Create account',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _isLogin ? "Don't have an account? " : 'Already have an account? ',
                          style: const TextStyle(fontSize: 13, color: AppColors.muted),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _isLogin = !_isLogin),
                          child: Text(
                            _isLogin ? 'Sign up' : 'Sign in',
                            style: const TextStyle(fontSize: 13, color: AppColors.purple, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.muted)),
  );

  Widget _field(TextEditingController ctrl, String hint, TextInputType type, {bool obscure = false}) =>
    TextField(
      controller: ctrl,
      keyboardType: type,
      obscureText: obscure,
      style: const TextStyle(fontSize: 14, color: AppColors.textDark),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.muted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.purple)),
        filled: true,
        fillColor: Colors.white,
      ),
    );
}
