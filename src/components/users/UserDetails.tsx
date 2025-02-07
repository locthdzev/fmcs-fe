import React from "react";

type User = {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  roles: string[];
  gender: string;
  dob: string;
  address: string;
  phone: string;
  createdAt: string;
  status?: string;
};

type Props = {
  user: User;
  onClose: () => void;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

export const UserDetails: React.FC<Props> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 transition-all duration-300 transform scale-95 animate-fadeIn">
        <h2 className="text-xl font-bold mb-4">User Details</h2>
        <p><strong>Name:</strong> {user.fullName}</p>
        <p><strong>Username:</strong> {user.userName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.roles.join(", ")}</p>
        <p><strong>Gender:</strong> {user.gender}</p>
        <p><strong>DOB:</strong> {formatDate(user.dob)}</p>
        <p><strong>Address:</strong> {user.address}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Created At:</strong> {formatDate(user.createdAt)}</p>
        <p><strong>Status:</strong> {user.status}</p>

        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};
