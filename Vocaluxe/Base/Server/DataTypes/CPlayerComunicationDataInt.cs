using System;
using System.Runtime.Serialization;

namespace Vocaluxe.Base.Server.DataTypes
{
    [Serializable]
    public class CPlayerComunicationDataInt : CPlayerComunicationData
    {
        public int Value { get; set; }

        public override void GetObjectData(SerializationInfo info, StreamingContext context)
        {
            info.AddValue("Value", Value);
        }
    }
}
