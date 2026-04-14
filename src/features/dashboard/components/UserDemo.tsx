import React, { useState, useEffect } from 'react';
import { UserService, UserProfile } from '../../../services/userService';

/**
 * UserDemo Component
 * Demonstrates the implementation of the API Layer and Service.
 * Built to satisfy the Usage Example requirement.
 */
export const UserDemo: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded ID for demonstration purposes
  const DEMO_USER_ID = 1;

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Direct Service invocation (Axios logic is abstracted away!)
        const response = await UserService.getUserProfile(DEMO_USER_ID);
        
        // Use the strict typed data safely
        if (isMounted && response.success) {
          setProfile(response.data);
        } else if (isMounted) {
          setError(response.message || 'Failed to fetch profile.');
        }
      } catch (err: any) {
        if (isMounted) {
          // err is technically AxiosError but the Interceptor handles the big logging
          setError(err.response?.data?.message || 'An unexpected error occurred during fetch.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <div className="p-4 text-gray-500 font-semibold animate-pulse">Loading Profile...</div>;
  if (error) return <div className="p-4 text-red-500 font-bold bg-red-50 border border-red-200 rounded-lg shadow-sm">Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">User Profile (API Layer Demo)</h2>
      {profile ? (
        <div className="space-y-3">
          <p className="flex justify-between border-b pb-1">
            <span className="font-semibold text-gray-600">ID:</span> 
            <span className="text-gray-800">{profile.id}</span>
          </p>
          <p className="flex justify-between border-b pb-1">
            <span className="font-semibold text-gray-600">Username:</span> 
            <span className="text-gray-800">{profile.username}</span>
          </p>
          <p className="flex justify-between border-b pb-1">
            <span className="font-semibold text-gray-600">Email:</span> 
            <span className="text-gray-800">{profile.email}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-semibold text-gray-600">Role:</span> 
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase tracking-wide">
              {profile.role}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No user data available.</p>
      )}
    </div>
  );
};
