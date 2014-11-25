
using System;
using System.Runtime.Serialization;

namespace ServerLib.DataTypes
{
    [Serializable]
    public abstract class CPlayerComunicationData : ISerializable
    {
        public abstract void GetObjectData(SerializationInfo info, StreamingContext context);
    }
}
