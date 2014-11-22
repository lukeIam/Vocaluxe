using System;
using System.Runtime.Serialization;

namespace ServerLib.DataTypes
{
    [Serializable]
    public class CPlayerComunicationDataString : CPlayerComunicationData
    {
        [DataMember]
        public string Data { get; set; }
    }
}
