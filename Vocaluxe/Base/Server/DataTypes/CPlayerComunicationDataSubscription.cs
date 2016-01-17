using System;
using System.Runtime.Serialization;

namespace Vocaluxe.Base.Server.DataTypes
{
    [Serializable]
    public class CPlayerComunicationDataSubscription : CPlayerComunicationData
    {
        [DataMember]
        public EPlayerComunicationType Type { get; set; }
        [DataMember]
        public int PlayerId { get; set; }

        public override void GetObjectData(SerializationInfo info, StreamingContext context)
        {
            info.AddValue("Type", Type);
            info.AddValue("PlayerId", PlayerId);
        }
    }
}
