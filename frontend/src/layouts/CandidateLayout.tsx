import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function CandidateLayout({ children }) {
  const [user, setUser] = useState({
    name: 'Mpumelelo Magagula',
    email: 'mpumelelo130@gmail.com',
    profilePicture: null
  });

  useEffect(() => {
    // Fetch user data from API
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const response = await fetch('/api/candidate/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUser({
      name: data.first_name + ' ' + data.last_name,
      email: data.email,
      profilePicture: data.profile_photo
    });
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        profilePicture={user.profilePicture}
        userName={user.name}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}