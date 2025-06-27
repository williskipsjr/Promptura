import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthForm from '../components/auth/AuthForm';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="max-w-md mx-auto text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="heading text-3xl mb-4 text-text-primary">Sign In to Promptura</h1>
          <p className="text-text-secondary">
            Welcome back! Please sign in to continue.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AuthForm mode="login" />
          
          <p className="text-center mt-6 text-text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-400 hover:text-primary-300 transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;