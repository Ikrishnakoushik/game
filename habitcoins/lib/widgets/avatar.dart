import 'package:flutter/material.dart';

class AvatarWidget extends StatelessWidget {
  final String initials;
  final Color color;
  final Color textColor;
  final double size;

  const AvatarWidget({
    super.key,
    required this.initials,
    required this.color,
    required this.textColor,
    this.size = 36,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: TextStyle(
          color: textColor,
          fontSize: size * 0.35,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
