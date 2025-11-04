// import React from "react";
import DeviceCard from "./DeviceCard";

const BackupHumidifier = ({className=""}) => {
  return (
    <div
    className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col justify-between ${className || ""}`}
    >
      <DeviceCard
        name="Backup Humidifier"
        image="/humidifier.svg"
        initialState={false}  // starts Off
        duration="1h 02min"
      />
    </div>
  );
};

export default BackupHumidifier;
