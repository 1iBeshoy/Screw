import 'package:flutter/material.dart';
import 'package:screw_game/intro_page_screen.dart';

void main() {

  WidgetsFlutterBinding.ensureInitialized();
  runApp(const IntroPage());
}

class IntroPage extends StatelessWidget {
  const IntroPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: IntroPageScreen()
    );
  }
}
