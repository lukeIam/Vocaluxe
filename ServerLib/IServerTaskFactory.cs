using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServerLib
{
    public interface IServerTaskFactory
    {
        Task<SProfileData> createTask_GetProfileData(int profileId, bool isReadonly);
    }
}
