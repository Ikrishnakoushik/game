import 'package:flutter/material.dart';
import '../theme/colors.dart';

class Friend {
  final int id;
  final String name;
  final String username;
  final int coins;
  final String avatar;
  final Color color;
  final Color textColor;
  final bool isConnected;
  final int commonHabits;

  const Friend({
    required this.id,
    required this.name,
    required this.username,
    required this.coins,
    required this.avatar,
    required this.color,
    required this.textColor,
    required this.isConnected,
    required this.commonHabits,
  });
}

class Habit {
  final int id;
  final String name;
  final int days;
  int done;
  final String mode; // coins, donate, sub
  final int coinRate;
  final List<String> members;
  bool checkedToday;
  final int donateAmount;
  final String charity;

  Habit({
    required this.id,
    required this.name,
    required this.days,
    required this.done,
    required this.mode,
    required this.coinRate,
    required this.members,
    required this.checkedToday,
    required this.donateAmount,
    required this.charity,
  });

  Habit copyWith({bool? checkedToday, int? done}) {
    return Habit(
      id: id,
      name: name,
      days: days,
      done: done ?? this.done,
      mode: mode,
      coinRate: coinRate,
      members: members,
      checkedToday: checkedToday ?? this.checkedToday,
      donateAmount: donateAmount,
      charity: charity,
    );
  }
}

class Reward {
  final int id;
  final String name;
  final String category;
  final int cost;
  final String icon;

  const Reward({
    required this.id,
    required this.name,
    required this.category,
    required this.cost,
    required this.icon,
  });
}

class LeaderboardEntry {
  final String name;
  final int streak;
  final int coins;
  final String avatar;
  final Color color;
  final Color textColor;

  const LeaderboardEntry({
    required this.name,
    required this.streak,
    required this.coins,
    required this.avatar,
    required this.color,
    required this.textColor,
  });
}

// ── Sample Data ──────────────────────────────────────────────────────────────

final List<Friend> sampleFriends = [
  const Friend(id: 1, name: 'Arjun Joshi', username: '@arjun.j', coins: 980, avatar: 'AJ', color: AppColors.tealLight, textColor: AppColors.teal, isConnected: true, commonHabits: 2),
  const Friend(id: 2, name: 'Priya Sharma', username: '@priya.s', coins: 920, avatar: 'PS', color: AppColors.greenLight, textColor: AppColors.green, isConnected: true, commonHabits: 3),
  const Friend(id: 3, name: 'Nikhil M.', username: '@nikhil.m', coins: 760, avatar: 'NM', color: AppColors.amberLight, textColor: AppColors.amberDark, isConnected: true, commonHabits: 1),
  const Friend(id: 4, name: 'Sree V.', username: '@sree.v', coins: 310, avatar: 'SV', color: AppColors.redLight, textColor: AppColors.red, isConnected: true, commonHabits: 2),
  const Friend(id: 5, name: 'Akshay Kumar', username: '@akshay.k', coins: 1100, avatar: 'AK', color: AppColors.purpleLight, textColor: AppColors.purple, isConnected: false, commonHabits: 0),
  const Friend(id: 6, name: 'Zara Khan', username: '@zara.khan', coins: 850, avatar: 'ZK', color: AppColors.pinkLight, textColor: AppColors.pink, isConnected: false, commonHabits: 0),
];

List<Habit> buildInitialHabits() => [
  Habit(id: 1, name: 'Morning workout', days: 21, done: 14, mode: 'coins', coinRate: 50, members: ['You', 'Arjun', 'Priya', 'Nikhil'], checkedToday: true, donateAmount: 0, charity: ''),
  Habit(id: 2, name: 'No social media after 9pm', days: 30, done: 12, mode: 'donate', coinRate: 30, members: ['You', 'Sree', 'Vikram'], checkedToday: false, donateAmount: 15, charity: 'Plant a Tree'),
  Habit(id: 3, name: 'Sleep before midnight', days: 30, done: 18, mode: 'sub', coinRate: 100, members: ['You', 'Arjun', 'Priya', 'Nikhil', 'Sree'], checkedToday: true, donateAmount: 0, charity: ''),
];

const List<Reward> rewards = [
  Reward(id: 1, name: 'Cult.fit — 1 month free', category: 'Fitness', cost: 2000, icon: '🏋️'),
  Reward(id: 2, name: 'Amazon — ₹200 voucher', category: 'Shopping', cost: 1500, icon: '🛍️'),
  Reward(id: 3, name: 'Zomato — ₹100 off', category: 'Food', cost: 800, icon: '🍱'),
  Reward(id: 4, name: 'Audible — 1 month free', category: 'Learning', cost: 1000, icon: '🎧'),
  Reward(id: 5, name: 'Swiggy — ₹150 off', category: 'Food', cost: 1200, icon: '🛵'),
  Reward(id: 6, name: 'Myntra — ₹300 voucher', category: 'Fashion', cost: 1800, icon: '👗'),
];

const List<LeaderboardEntry> leaderboard = [
  LeaderboardEntry(name: 'You (Ravi)', streak: 15, coins: 1240, avatar: 'RK', color: AppColors.purpleLight, textColor: AppColors.purple),
  LeaderboardEntry(name: 'Priya S.', streak: 14, coins: 980, avatar: 'PS', color: AppColors.greenLight, textColor: AppColors.green),
  LeaderboardEntry(name: 'Nikhil M.', streak: 12, coins: 760, avatar: 'NM', color: AppColors.amberLight, textColor: AppColors.amberDark),
  LeaderboardEntry(name: 'Arjun J.', streak: 9, coins: 520, avatar: 'AJ', color: AppColors.tealLight, textColor: AppColors.teal),
  LeaderboardEntry(name: 'Sree V.', streak: 6, coins: 310, avatar: 'SV', color: AppColors.redLight, textColor: AppColors.red),
];
