"use client";
import React from 'react';
export const Toast = ({ message }: { message: string }) => (
  <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
    <div className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg">{message}</div>
  </div>
);
