#region license
// This file is part of Vocaluxe.
// 
// Vocaluxe is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// Vocaluxe is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with Vocaluxe. If not, see <http://www.gnu.org/licenses/>.
#endregion

using System;
using System.Collections.Generic;
using System.Linq;
using PortAudioSharp;

namespace Vocaluxe.Lib.Sound
{
    public static class CPortAudioDeviceHelper
    {
        public static IEnumerable<CPortAudioDeviceCandidate> GetPossibleDevices(bool requrieInputChannels = false, bool requrieOutputChannels = false)
        {
            var deviceCandidates = new List<CPortAudioDeviceCandidate>();
            int numDevices = PortAudioSharp.PortAudio.Pa_GetDeviceCount();

            for (int i = 0; i < numDevices; i++)
            {
                PortAudioSharp.PortAudio.PaDeviceInfo info = PortAudioSharp.PortAudio.Pa_GetDeviceInfo(i);
                if ((requrieInputChannels && info.maxInputChannels > 0) || (requrieOutputChannels && info.maxOutputChannels > 0))
                {
                    PortAudio.PaHostApiInfo apiInfo = PortAudio.Pa_GetHostApiInfo(info.hostApi);
                    deviceCandidates.Add(new CPortAudioDeviceCandidate() { Priority = _GetPriorityForHostApi(apiInfo), DeviceId = i, HostAPI = apiInfo.name, DeviceInfo = info });
                }
            }

            return deviceCandidates.GroupBy(t => t.DeviceInfo.name, (key, g) => g.OrderBy(t => t.Priority).First()).OrderBy(t => t.Priority);
        }

        private static int _GetPriorityForHostApi(PortAudio.PaHostApiInfo apiInfo)
        {

            switch (apiInfo.type)
            {
                #region HostApi priorities for Windows
#if WIN
                case PortAudio.PaHostApiTypeId.paInDevelopment:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paDirectSound:
                    return 4;
                case PortAudio.PaHostApiTypeId.paMME:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paASIO:
                    return 0;
                case PortAudio.PaHostApiTypeId.paSoundManager:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paCoreAudio:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paOSS:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paALSA:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paAL:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paBeOS:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paWDMKS:
                    return 3;
                case PortAudio.PaHostApiTypeId.paJACK:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paWASAPI:
                    return 2;
                case PortAudio.PaHostApiTypeId.paAudioScienceHPI:
                    return int.MaxValue;
#endif
                #endregion

                #region HostApi priorities for Linux
#if LINUX
                case PortAudio.PaHostApiTypeId.paInDevelopment:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paDirectSound:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paMME:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paASIO:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paSoundManager:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paCoreAudio:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paOSS:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paALSA:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paAL:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paBeOS:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paWDMKS:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paJACK:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paWASAPI:
                    return int.MaxValue;
                case PortAudio.PaHostApiTypeId.paAudioScienceHPI:
                    return int.MaxValue;
#endif
                #endregion
                default:
                    return int.MaxValue;
            }
        }

        public class CPortAudioDeviceCandidate
        {
            public int Priority { get; set; }
            public int DeviceId { get; set; }
            public string HostAPI { get; set; }
            public PortAudioSharp.PortAudio.PaDeviceInfo DeviceInfo { get; set; }
        }
    }
}
