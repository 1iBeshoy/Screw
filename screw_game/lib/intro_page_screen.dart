import 'package:flutter/material.dart';
import 'package:screw_game/core/mixins/app_strings.dart';

class IntroPageScreen extends StatelessWidget {
  const IntroPageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text(AppStrings.welcomeString),
      ),
    );
  }
}
