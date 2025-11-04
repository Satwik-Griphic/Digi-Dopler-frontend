import React from "react";
import DeviceCard from "./DeviceCard";

const BackupAC: React.FC = () => {
  return (
    <DeviceCard
      name="Backup AC"
      image="/ac.svg"
      initialState={true}  // starts On
      duration="1h 02min"
    />
  );
};

export default BackupAC;
