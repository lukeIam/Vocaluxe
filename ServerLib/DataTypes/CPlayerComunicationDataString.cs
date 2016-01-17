﻿using System;
using System.Runtime.Serialization;

namespace ServerLib.DataTypes
{
    [Serializable]
    public class CPlayerComunicationDataString : CPlayerComunicationData
    {
        [DataMember]
        public string Data { get; set; }

        public override void GetObjectData(SerializationInfo info, StreamingContext context)
        {
            info.AddValue("Data", Data);
        }
    }
}