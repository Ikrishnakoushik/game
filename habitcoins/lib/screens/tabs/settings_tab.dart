import 'package:flutter/material.dart';
import '../../theme/colors.dart';

class SettingsTab extends StatefulWidget {
  const SettingsTab({super.key});

  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  bool _pushNotifications = true;
  bool _emailUpdates = false;
  bool _showOnLeaderboard = true;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionLabel('NOTIFICATIONS'),
          _toggle('Push notifications', 'App reminders for check-ins', _pushNotifications, (v) => setState(() => _pushNotifications = v)),
          _toggle('Email updates', 'Weekly habit reports', _emailUpdates, (v) => setState(() => _emailUpdates = v)),
          const SizedBox(height: 8),
          _sectionLabel('PRIVACY'),
          _toggle('Show on leaderboard', 'Let friends see your rank', _showOnLeaderboard, (v) => setState(() => _showOnLeaderboard = v)),
          const SizedBox(height: 8),
          _sectionLabel('DISPLAY'),
          _toggleDisabled('Dark mode', 'Coming soon'),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(text, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 1)),
  );

  Widget _toggle(String label, String desc, bool value, ValueChanged<bool> onChanged) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    decoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textDark)),
              Text(desc, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
            ],
          ),
        ),
        Switch(value: value, onChanged: onChanged, activeThumbColor: AppColors.purple),
      ],
    ),
  );

  Widget _toggleDisabled(String label, String desc) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    decoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textDark)),
              Text(desc, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
            ],
          ),
        ),
        Switch(value: false, onChanged: null, activeThumbColor: AppColors.purple),
      ],
    ),
  );
}
