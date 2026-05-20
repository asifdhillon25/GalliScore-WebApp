import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/header.component";
import { Play, Trophy, Users, BarChart3, Zap, Star } from 'lucide-react';

function Home() {
  const features = [
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Live Scoring",
      description: "Real-time score updates for local cricket matches",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Management",
      description: "Easily manage players and team lineups",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Detailed Stats",
      description: "Comprehensive batting and bowling statistics",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast & Reliable",
      description: "Works offline and on low-end devices",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cricket-100 dark:bg-cricket-900/30 text-cricket-800 dark:text-cricket-300 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Made for Local Cricket
          </div>
          
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 dark:text-white mb-6">
            Score Your <span className="text-cricket-600">Local Cricket</span> Matches
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            GalliScore brings professional cricket scoring to grassroots level. 
            Simple, reliable, and designed for outdoor use.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/OpeningData" className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2">
              <Play className="w-5 h-5" />
              Start New Match
            </Link>
            <Link to="/UserPage" className="btn-secondary text-lg px-8 py-3">
              View Past Matches
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-heading font-bold text-center text-gray-900 dark:text-white mb-12">
          Why Choose GalliScore?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card hover:scale-[1.02] transition-transform">
              <div className={`${feature.bg} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                <div className={feature.color}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-cricket-600 to-cricket-500 mt-12">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-white">
            <h2 className="text-3xl font-heading font-bold mb-6">
              Ready to Score Your Next Match?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of local cricket enthusiasts using GalliScore
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/SignUp" 
                className="bg-white text-cricket-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200"
              >
                Get Started Free
              </Link>
              <Link 
                to="/about" 
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;