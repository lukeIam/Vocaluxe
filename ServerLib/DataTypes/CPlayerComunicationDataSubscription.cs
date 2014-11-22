using System;
using System.Runtime.Serialization;

namespace ServerLib.DataTypes
{
    [Serializable]
    public class CPlayerComunicationDataSubscription : CPlayerComunicationData
    {
        [DataMember]
        public EPlayerComunicationType Type { get; set; }
        [DataMember]
        public int PlayerId { get; set; }
    }
}
