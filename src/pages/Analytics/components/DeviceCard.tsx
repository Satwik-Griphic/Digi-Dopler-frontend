import React, { useState } from "react";

interface DeviceCardProps {
  name: string;
  image: string;
  initialState?: boolean; // default on/off
  duration: string;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  name,
  image,
  initialState = false,
  duration,
}) => {
  const [isOn, setIsOn] = useState(initialState);

  const toggleDevice = () => {
    setIsOn((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center justify-between bg-white transition-all h-auto w-auto">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-3">
        <span className={`text-sm font-medium ${isOn ? "text-gray-800" : "text-gray-500"}`}>
          {isOn ? "On" : "Off"}
        </span>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isOn}
            onChange={toggleDevice}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 transition">
            <div
              className={`absolute top-[2px] left-[2px] h-4 w-4 bg-white rounded-full border border-gray-300 transition-transform ${
                isOn ? "translate-x-5" : ""
              }`}
            ></div>
          </div>
        </label>
      </div>

      {/* Image & Info */}
      <div className="flex flex-col items-center justify-center">
        <div className="bg-blue-50 rounded-full p-5 mb-3">
          <img src={image} alt={name} className="w-20 h-20 object-contain" />
        </div>
        <h3 className="text-black text-lg font-semibold">{name}</h3>
        <p className="text-gray-500 text-sm">{duration}</p>
      </div>
    </div>
  );
};

export default DeviceCard;
