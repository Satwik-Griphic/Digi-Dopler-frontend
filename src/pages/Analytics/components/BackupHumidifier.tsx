import React from "react";
import DeviceCard from "./DeviceCard";

const BackupHumidifier: React.FC = () => {
  return (
    <DeviceCard
      name="Backup Humidifier"
      image="/humidifier.svg"
      initialState={false}  // starts Off
      duration="1h 02min"
    />
  );
};

export default BackupHumidifier;
