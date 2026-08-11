import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">About Prism</h1>
      <p className="text-slate-400 max-w-lg text-center">
        Prism is designed to give technical interviewers full visibility into candidate-AI interactions during coding interviews.
      </p>
      <a href="/" className="text-purple-400 hover:underline text-sm">
        ← Back to Home
      </a>
    </div>
  );
};
