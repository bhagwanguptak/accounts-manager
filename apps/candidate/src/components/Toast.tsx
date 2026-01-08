
'use client';
export const Toast=({message}:{message:string})=>(
<div className="fixed inset-0 flex items-center justify-center z-50">
  <div className="bg-green-600 text-white px-8 py-1 rounded-2xl font-bold">{message}</div>
</div>
);
