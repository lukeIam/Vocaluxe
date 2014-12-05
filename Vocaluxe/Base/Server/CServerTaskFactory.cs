using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ServerLib;

namespace Vocaluxe.Base.Server
{
    class CServerTaskFactory : IServerTaskFactory
    {
        public Task<SProfileData> createTask_GetProfileData(int profileId, bool isReadonly)
        {
            var task = new Task<SProfileData>(() => CVocaluxeServer._GetProfileData(profileId, isReadonly));
            CVocaluxeServer.EnqueueServerTask(task);
            return task;
        }
    }
}
