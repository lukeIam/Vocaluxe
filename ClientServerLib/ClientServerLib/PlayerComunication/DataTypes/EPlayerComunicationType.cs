
using System;

namespace ServerLib.PlayerComunication.DataTypes
{
    [Serializable]
    public enum EPlayerComunicationType
    {
        RegisterSubscription,
        UnregisterSubscription,
        RemoteScreenActiveScreenUpdate,
        RemoteScreenPlayerSelestionScreenUpdate,
        RemoteScreenPlayerSelectionDataManipulation
    }
}
