import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10"></div>
      <div className="absolute inset-0 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/hero-background.jpg')] bg-cover bg-center"></div>
      
      <div className="relative z-20 flex flex-col justify-center h-full px-12 max-w-2xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-5xl md:text-6xl font-bold mb-4"
        >
          Unlimited movies, TV shows, and more
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white text-xl mb-4"
        >
          Watch anywhere. Cancel anytime.
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white text-lg mb-8"
        >
          Ready to watch? Start your free trial today.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link to="/register">
            <button className="bg-primary text-white px-8 py-3 rounded text-lg font-semibold hover:bg-red-700 transition">
              Get Started
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;