import React from "react";
import DeviceCard from "./DeviceCard";

const BackupAC = ({className=""}) => {
  return (
    <div 
    className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col justify-between ${className || ""}`}
    >
      <DeviceCard
        name="Backup AC"
        image="/ac.svg"
        initialState={true}  // starts On
        duration="1h 02min"
      />
    </div>
  );
};

export default BackupAC;
