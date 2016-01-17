
using System;

namespace Vocaluxe.Base.Server.DataTypes
{
    [Serializable]
    public enum EPlayerComunicationType
    {
        RegisterSubscription = 0,
        UnregisterSubscription = 1,
        SongChanged = 2

    }
}
