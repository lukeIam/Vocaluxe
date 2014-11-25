using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;

namespace ServerLib.DataTypes
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
