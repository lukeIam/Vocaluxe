﻿#region license
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
using System.ComponentModel;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;

namespace WebserverInitalConfig
{
    // ReSharper disable InconsistentNaming
    static class HttpApi
    {
        private static readonly HTTPAPI_VERSION HttpApiVersion = new HTTPAPI_VERSION(1, 0);

        #region DllImport
        [DllImport("httpapi.dll", SetLastError = true)]
        private static extern uint HttpInitialize(
            HTTPAPI_VERSION version,
            uint flags,
            IntPtr pReserved);

        [DllImport("httpapi.dll", SetLastError = true)]
        private static extern uint HttpSetServiceConfiguration(
            IntPtr serviceIntPtr,
            HTTP_SERVICE_CONFIG_ID configId,
            IntPtr pConfigInformation,
            int configInformationLength,
            IntPtr pOverlapped);

        [DllImport("httpapi.dll", SetLastError = true)]
        private static extern uint HttpDeleteServiceConfiguration(
            IntPtr serviceIntPtr,
            HTTP_SERVICE_CONFIG_ID configId,
            IntPtr pConfigInformation,
            int configInformationLength,
            IntPtr pOverlapped);

        [DllImport("httpapi.dll", SetLastError = true)]
        private static extern uint HttpTerminate(
            uint Flags,
            IntPtr pReserved);

        [DllImport("httpapi.dll", SetLastError = true)]
        private static extern uint HttpQueryServiceConfiguration(
            IntPtr serviceIntPtr,
            HTTP_SERVICE_CONFIG_ID configId,
            IntPtr pInputConfigInfo,
            int inputConfigInfoLength,
            IntPtr pOutputConfigInfo,
            int outputConfigInfoLength,
            [Optional] out int pReturnLength,
            IntPtr pOverlapped);

        private enum HTTP_SERVICE_CONFIG_ID
        {
            HttpServiceConfigIPListenList = 0,
            HttpServiceConfigSSLCertInfo,
            HttpServiceConfigUrlAclInfo,
            HttpServiceConfigMax
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct HTTP_SERVICE_CONFIG_SSL_SET
        {
            public HTTP_SERVICE_CONFIG_SSL_KEY KeyDesc;
            public HTTP_SERVICE_CONFIG_SSL_PARAM ParamDesc;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct HTTP_SERVICE_CONFIG_SSL_KEY
        {
            public IntPtr pIpPort;

            public HTTP_SERVICE_CONFIG_SSL_KEY(IntPtr pIpPort)
            {
                this.pIpPort = pIpPort;
            }
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct HTTP_SERVICE_CONFIG_SSL_PARAM
        {
            public int SslHashLength;
            public IntPtr pSslHash;
            public Guid AppId;
            [MarshalAs(UnmanagedType.LPWStr)] public string pSslCertStoreName;
            public uint DefaultCertCheckMode;
            public int DefaultRevocationFreshnessTime;
            public int DefaultRevocationUrlRetrievalTimeout;
            [MarshalAs(UnmanagedType.LPWStr)] public string pDefaultSslCtlIdentifier;
            [MarshalAs(UnmanagedType.LPWStr)] public string pDefaultSslCtlStoreName;
            public uint DefaultFlags;
        }

        [StructLayout(LayoutKind.Sequential, Pack = 2)]
        private struct HTTPAPI_VERSION
        {
            public ushort HttpApiMajorVersion;
            public ushort HttpApiMinorVersion;

            public HTTPAPI_VERSION(ushort majorVersion, ushort minorVersion)
            {
                HttpApiMajorVersion = majorVersion;
                HttpApiMinorVersion = minorVersion;
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct HTTP_SERVICE_CONFIG_SSL_QUERY
        {
            public HTTP_SERVICE_CONFIG_QUERY_TYPE QueryDesc;
            public HTTP_SERVICE_CONFIG_SSL_KEY KeyDesc;
            public uint dwToken;
        }

        private enum HTTP_SERVICE_CONFIG_QUERY_TYPE
        {
            HttpServiceConfigQueryExact = 0,
            HttpServiceConfigQueryNext,
            HttpServiceConfigQueryMax
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct HTTP_SERVICE_CONFIG_URLACL_SET
        {
            public HTTP_SERVICE_CONFIG_URLACL_KEY KeyDesc;
            public HTTP_SERVICE_CONFIG_URLACL_PARAM ParamDesc;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct HTTP_SERVICE_CONFIG_URLACL_QUERY
        {
            public HTTP_SERVICE_CONFIG_QUERY_TYPE QueryDesc;
            public HTTP_SERVICE_CONFIG_URLACL_KEY KeyDesc;
            public uint dwToken;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct HTTP_SERVICE_CONFIG_URLACL_KEY
        {
            [MarshalAs(UnmanagedType.LPWStr)] public string pUrlPrefix;

            public HTTP_SERVICE_CONFIG_URLACL_KEY(string urlPrefix)
            {
                pUrlPrefix = urlPrefix;
            }
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct HTTP_SERVICE_CONFIG_URLACL_PARAM
        {
            [MarshalAs(UnmanagedType.LPWStr)] public string pStringSecurityDescriptor;

            public HTTP_SERVICE_CONFIG_URLACL_PARAM(string securityDescriptor)
            {
                pStringSecurityDescriptor = securityDescriptor;
            }
        }
        #endregion

        #region Constants
        public const uint HTTP_INITIALIZE_CONFIG = 0x00000002;
        public const uint HTTP_SERVICE_CONFIG_SSL_FLAG_NEGOTIATE_CLIENT_CERT = 0x00000002;
        public const uint HTTP_SERVICE_CONFIG_SSL_FLAG_NO_RAW_FILTER = 0x00000004;
        private const uint NOERROR = 0;
        private const uint ERROR_INSUFFICIENT_BUFFER = 122;
        private const uint ERROR_ALREADY_EXISTS = 183;
        private const uint ERROR_FILE_NOT_FOUND = 2;
        private const int ERROR_NO_MORE_ITEMS = 259;
        #endregion

        #region Public methods
        public class SslCertificateInfo
        {
            public byte[] Hash { get; set; }
            public Guid AppId { get; set; }
            public string StoreName { get; set; }
            public IPEndPoint IpPort { get; set; }
        }

        public static SslCertificateInfo QuerySslCertificateInfo(IPEndPoint ipPort)
        {
            SslCertificateInfo result = null;

            uint retVal;
            CallHttpApi(delegate
                {
                    GCHandle sockAddrHandle = CreateSockaddrStructure(ipPort);
                    IntPtr pIpPort = sockAddrHandle.AddrOfPinnedObject();
                    HTTP_SERVICE_CONFIG_SSL_KEY sslKey = new HTTP_SERVICE_CONFIG_SSL_KEY(pIpPort);

                    HTTP_SERVICE_CONFIG_SSL_QUERY inputConfigInfoQuery =
                        new HTTP_SERVICE_CONFIG_SSL_QUERY
                            {
                                QueryDesc = HTTP_SERVICE_CONFIG_QUERY_TYPE.HttpServiceConfigQueryExact,
                                KeyDesc = sslKey
                            };

                    IntPtr pInputConfigInfo =
                        Marshal.AllocCoTaskMem(Marshal.SizeOf(typeof(HTTP_SERVICE_CONFIG_SSL_QUERY)));
                    Marshal.StructureToPtr(inputConfigInfoQuery, pInputConfigInfo, false);

                    IntPtr pOutputConfigInfo = IntPtr.Zero;
                    int returnLength = 0;

                    try
                    {
                        HTTP_SERVICE_CONFIG_ID queryType = HTTP_SERVICE_CONFIG_ID.HttpServiceConfigSSLCertInfo;
                        int inputConfigInfoSize = Marshal.SizeOf(inputConfigInfoQuery);
                        retVal = HttpQueryServiceConfiguration(IntPtr.Zero,
                                                               queryType,
                                                               pInputConfigInfo,
                                                               inputConfigInfoSize,
                                                               pOutputConfigInfo,
                                                               returnLength,
                                                               out returnLength,
                                                               IntPtr.Zero);
                        if (retVal == ERROR_FILE_NOT_FOUND)
                            return;

                        if (ERROR_INSUFFICIENT_BUFFER == retVal)
                        {
                            pOutputConfigInfo = Marshal.AllocCoTaskMem(returnLength);

                            try
                            {
                                retVal = HttpQueryServiceConfiguration(IntPtr.Zero,
                                                                       queryType,
                                                                       pInputConfigInfo,
                                                                       inputConfigInfoSize,
                                                                       pOutputConfigInfo,
                                                                       returnLength,
                                                                       out returnLength,
                                                                       IntPtr.Zero);
                                ThrowWin32ExceptionIfError(retVal);

                                var outputConfigInfo =
                                    (HTTP_SERVICE_CONFIG_SSL_SET)
                                    Marshal.PtrToStructure(pOutputConfigInfo, typeof(HTTP_SERVICE_CONFIG_SSL_SET));

                                byte[] hash = new byte[outputConfigInfo.ParamDesc.SslHashLength];
                                Marshal.Copy(outputConfigInfo.ParamDesc.pSslHash, hash, 0, hash.Length);

                                Guid appId = outputConfigInfo.ParamDesc.AppId;
                                string storeName = outputConfigInfo.ParamDesc.pSslCertStoreName;

                                result = new SslCertificateInfo {AppId = appId, Hash = hash, StoreName = storeName, IpPort = ipPort};
                            }
                            finally
                            {
                                Marshal.FreeCoTaskMem(pOutputConfigInfo);
                            }
                        }
                        else
                            ThrowWin32ExceptionIfError(retVal);
                    }
                    finally
                    {
                        Marshal.FreeCoTaskMem(pInputConfigInfo);
                        if (sockAddrHandle.IsAllocated)
                            sockAddrHandle.Free();
                    }
                });

            return result;
        }

        public static void BindCertificate(IPEndPoint ipPort, byte[] hash, StoreName storeName, Guid appId)
        {
            if (ipPort == null)
                throw new ArgumentNullException("ipPort");
            if (hash == null)
                throw new ArgumentNullException("hash");

            CallHttpApi(
                delegate
                    {
                        HTTP_SERVICE_CONFIG_SSL_SET configSslSet = new HTTP_SERVICE_CONFIG_SSL_SET();

                        GCHandle sockAddrHandle = CreateSockaddrStructure(ipPort);
                        IntPtr pIpPort = sockAddrHandle.AddrOfPinnedObject();
                        HTTP_SERVICE_CONFIG_SSL_KEY httpServiceConfigSslKey =
                            new HTTP_SERVICE_CONFIG_SSL_KEY(pIpPort);
                        HTTP_SERVICE_CONFIG_SSL_PARAM configSslParam = new HTTP_SERVICE_CONFIG_SSL_PARAM();


                        GCHandle handleHash = GCHandle.Alloc(hash, GCHandleType.Pinned);
                        configSslParam.AppId = appId;
                        configSslParam.DefaultCertCheckMode = 0;
                        configSslParam.DefaultFlags = 0; //HTTP_SERVICE_CONFIG_SSL_FLAG_NEGOTIATE_CLIENT_CERT;
                        configSslParam.DefaultRevocationFreshnessTime = 0;
                        configSslParam.DefaultRevocationUrlRetrievalTimeout = 0;
                        configSslParam.pSslCertStoreName = storeName.ToString();
                        configSslParam.pSslHash = handleHash.AddrOfPinnedObject();
                        configSslParam.SslHashLength = hash.Length;
                        configSslSet.ParamDesc = configSslParam;
                        configSslSet.KeyDesc = httpServiceConfigSslKey;

                        IntPtr pInputConfigInfo =
                            Marshal.AllocCoTaskMem(Marshal.SizeOf(typeof(HTTP_SERVICE_CONFIG_SSL_SET)));
                        Marshal.StructureToPtr(configSslSet, pInputConfigInfo, false);

                        try
                        {
                            uint retVal = HttpSetServiceConfiguration(IntPtr.Zero,
                                                                      HTTP_SERVICE_CONFIG_ID.HttpServiceConfigSSLCertInfo,
                                                                      pInputConfigInfo,
                                                                      Marshal.SizeOf(configSslSet),
                                                                      IntPtr.Zero);

                            if (ERROR_ALREADY_EXISTS != retVal)
                                ThrowWin32ExceptionIfError(retVal);
                            else
                            {
                                retVal = HttpDeleteServiceConfiguration(IntPtr.Zero,
                                                                        HTTP_SERVICE_CONFIG_ID.HttpServiceConfigSSLCertInfo,
                                                                        pInputConfigInfo,
                                                                        Marshal.SizeOf(configSslSet),
                                                                        IntPtr.Zero);
                                ThrowWin32ExceptionIfError(retVal);

                                retVal = HttpSetServiceConfiguration(IntPtr.Zero,
                                                                     HTTP_SERVICE_CONFIG_ID.HttpServiceConfigSSLCertInfo,
                                                                     pInputConfigInfo,
                                                                     Marshal.SizeOf(configSslSet),
                                                                     IntPtr.Zero);
                                ThrowWin32ExceptionIfError(retVal);
                            }
                        }
                        finally
                        {
                            Marshal.FreeCoTaskMem(pInputConfigInfo);
                            if (handleHash.IsAllocated)
                                handleHash.Free();
                            if (sockAddrHandle.IsAllocated)
                                sockAddrHandle.Free();
                        }
                    });
        }

        public static void DeleteCertificateBinding(params IPEndPoint[] ipPorts)
        {
            if (ipPorts == null || ipPorts.Length == 0)
                return;

            CallHttpApi(
                delegate
                    {
                        foreach (IPEndPoint ipPort in ipPorts)
                        {
                            HTTP_SERVICE_CONFIG_SSL_SET configSslSet =
                                new HTTP_SERVICE_CONFIG_SSL_SET();

                            GCHandle sockAddrHandle = CreateSockaddrStructure(ipPort);
                            IntPtr pIpPort = sockAddrHandle.AddrOfPinnedObject();
                            HTTP_SERVICE_CONFIG_SSL_KEY httpServiceConfigSslKey =
                                new HTTP_SERVICE_CONFIG_SSL_KEY(pIpPort);
                            configSslSet.KeyDesc = httpServiceConfigSslKey;

                            IntPtr pInputConfigInfo =
                                Marshal.AllocCoTaskMem(
                                    Marshal.SizeOf(typeof(HTTP_SERVICE_CONFIG_SSL_SET)));
                            Marshal.StructureToPtr(configSslSet, pInputConfigInfo, false);

                            try
                            {
                                uint retVal = HttpDeleteServiceConfiguration(IntPtr.Zero,
                                                                             HTTP_SERVICE_CONFIG_ID.HttpServiceConfigSSLCertInfo,
                                                                             pInputConfigInfo,
                                                                             Marshal.SizeOf(configSslSet),
                                                                             IntPtr.Zero);
                                ThrowWin32ExceptionIfError(retVal);
                            }
                            finally
                            {
                                Marshal.FreeCoTaskMem(pInputConfigInfo);
                                if (sockAddrHandle.IsAllocated)
                                    sockAddrHandle.Free();
                            }
                        }
                    });
        }

        public static SslCertificateInfo[] QuerySslCertificateInfo()
        {
            var result = new List<SslCertificateInfo>();

            CallHttpApi(
                delegate
                    {
                        uint token = 0;

                        uint retVal;
                        do
                        {
                            HTTP_SERVICE_CONFIG_SSL_QUERY inputConfigInfoQuery =
                                new HTTP_SERVICE_CONFIG_SSL_QUERY
                                    {
                                        QueryDesc = HTTP_SERVICE_CONFIG_QUERY_TYPE.HttpServiceConfigQueryNext,
                                        dwToken = token,
                                    };

                            IntPtr pInputConfigInfo =
                                Marshal.AllocCoTaskMem(Marshal.SizeOf(typeof(HTTP_SERVICE_CONFIG_SSL_QUERY)));
                            Marshal.StructureToPtr(inputConfigInfoQuery, pInputConfigInfo, false);

                            IntPtr pOutputConfigInfo = IntPtr.Zero;
                            int returnLength = 0;

                            const HTTP_SERVICE_CONFIG_ID queryType = HTTP_SERVICE_CONFIG_ID.HttpServiceConfigSSLCertInfo;

                            try
                            {
                                int inputConfigInfoSize = Marshal.SizeOf(inputConfigInfoQuery);
                                retVal = HttpQueryServiceConfiguration(IntPtr.Zero,
                                                                       queryType,
                                                                       pInputConfigInfo,
                                                                       inputConfigInfoSize,
                                                                       pOutputConfigInfo,
                                                                       returnLength,
                                                                       out returnLength,
                                                                       IntPtr.Zero);
                                if (ERROR_NO_MORE_ITEMS == retVal)
                                    break;
                                if (ERROR_INSUFFICIENT_BUFFER == retVal)
                                {
                                    pOutputConfigInfo = Marshal.AllocCoTaskMem(returnLength);

                                    try
                                    {
                                        retVal = HttpQueryServiceConfiguration(IntPtr.Zero,
                                                                               queryType,
                                                                               pInputConfigInfo,
                                                                               inputConfigInfoSize,
                                                                               pOutputConfigInfo,
                                                                               returnLength,
                                                                               out returnLength,
                                                                               IntPtr.Zero);
                                        ThrowWin32ExceptionIfError(retVal);

                                        var outputConfigInfo = (HTTP_SERVICE_CONFIG_SSL_SET)Marshal.PtrToStructure(
                                            pOutputConfigInfo, typeof(HTTP_SERVICE_CONFIG_SSL_SET));

                                        byte[] hash = new byte[outputConfigInfo.ParamDesc.SslHashLength];
                                        Marshal.Copy(outputConfigInfo.ParamDesc.pSslHash, hash, 0, hash.Length);

                                        Guid appId = outputConfigInfo.ParamDesc.AppId;
                                        string storeName = outputConfigInfo.ParamDesc.pSslCertStoreName;
                                        IPEndPoint ipPort = ReadSockaddrStructure(outputConfigInfo.KeyDesc.pIpPort);

                                        var resultItem = new SslCertificateInfo
                                            {
                                                AppId = appId,
                                                Hash = hash,
                                                StoreName = storeName,
                                                IpPort = ipPort
                                            };
                                        result.Add(resultItem);
                                        token++;
                                    }
                                    finally
                                    {
                                        Marshal.FreeCoTaskMem(pOutputConfigInfo);
                                    }
                                }
                                else
                                    ThrowWin32ExceptionIfError(retVal);
                            }
                            finally
                            {
                                Marshal.FreeCoTaskMem(pInputConfigInfo);
                            }
                        } while (NOERROR == retVal);
                    });

            return result.ToArray();
        }

        private static HTTP_SERVICE_CONFIG_URLACL_SET QueryReservation(string networkURL)
        {
            if (String.IsNullOrEmpty(networkURL))
                throw new ArgumentNullException("networkURL");
            HTTP_SERVICE_CONFIG_URLACL_SET res = new HTTP_SERVICE_CONFIG_URLACL_SET {KeyDesc = new HTTP_SERVICE_CONFIG_URLACL_KEY("")};
            CallHttpApi(
                delegate
                    {
                        HTTP_SERVICE_CONFIG_URLACL_QUERY inputquery = new HTTP_SERVICE_CONFIG_URLACL_QUERY
                            {
                                QueryDesc = HTTP_SERVICE_CONFIG_QUERY_TYPE.HttpServiceConfigQueryExact,
                                KeyDesc = new HTTP_SERVICE_CONFIG_URLACL_KEY(networkURL)
                            };

                        IntPtr pInputQuery = Marshal.AllocCoTaskMem(Marshal.SizeOf(typeof(HTTP_SERVICE_CONFIG_URLACL_QUERY)));
                        Marshal.StructureToPtr(inputquery, pInputQuery, false);
                        IntPtr pOutputConfigInfo = IntPtr.Zero;
                        int returnLength = 0;
                        try
                        {
                            uint retVal = HttpQueryServiceConfiguration(IntPtr.Zero,
                                                                        HTTP_SERVICE_CONFIG_ID.HttpServiceConfigUrlAclInfo,
                                                                        pInputQuery,
                                                                        Marshal.SizeOf(inputquery),
                                                                        pOutputConfigInfo,
                                                                        returnLength,
                                                                        out returnLength,
                                                                        IntPtr.Zero);
                            if (ERROR_INSUFFICIENT_BUFFER == retVal)
                            {
                                pOutputConfigInfo = Marshal.AllocCoTaskMem(returnLength);
                                retVal = HttpQueryServiceConfiguration(IntPtr.Zero,
                                                                       HTTP_SERVICE_CONFIG_ID.HttpServiceConfigUrlAclInfo,
                                                                       pInputQuery,
                                                                       Marshal.SizeOf(inputquery),
                                                                       pOutputConfigInfo,
                                                                       returnLength,
                                                                       out returnLength,
                                                                       IntPtr.Zero);
                                if (ERROR_FILE_NOT_FOUND == retVal)
                                    return;
                                ThrowWin32ExceptionIfError(retVal);
                                res = (HTTP_SERVICE_CONFIG_URLACL_SET)Marshal.PtrToStructure(pOutputConfigInfo, typeof(HTTP_SERVICE_CONFIG_URLACL_SET));
                            }
                            else if (ERROR_FILE_NOT_FOUND != retVal)
                                ThrowWin32ExceptionIfError(retVal);
                        }
                        finally
                        {
                            Marshal.FreeCoTaskMem(pInputQuery);
                            if (pOutputConfigInfo != IntPtr.Zero)
                                Marshal.FreeCoTaskMem(pOutputConfigInfo);
                        }
                    }
                );
            return res;
        }

        public static uint DeleteReservation(string networkURL)
        {
            uint retVal = NOERROR;
            if (String.IsNullOrEmpty(networkURL))
                throw new ArgumentNullException("networkURL");
            HTTP_SERVICE_CONFIG_URLACL_SET oldReservation = QueryReservation(networkURL);
            if (oldReservation.KeyDesc.pUrlPrefix == "" && networkURL.Contains("+"))
            {
                networkURL = networkURL.Replace('+', '*');
                oldReservation = QueryReservation(networkURL);
            }
            if (oldReservation.KeyDesc.pUrlPrefix == "")
                return ERROR_FILE_NOT_FOUND;
            CallHttpApi(
                delegate
                    {
                        IntPtr pInputConfigInfo = Marshal.AllocCoTaskMem(Marshal.SizeOf(typeof(HTTP_SERVICE_CONFIG_URLACL_SET)));
                        Marshal.StructureToPtr(oldReservation, pInputConfigInfo, false);
                        try
                        {
                            retVal = HttpDeleteServiceConfiguration(IntPtr.Zero,
                                                                    HTTP_SERVICE_CONFIG_ID.HttpServiceConfigUrlAclInfo,
                                                                    pInputConfigInfo,
                                                                    Marshal.SizeOf(oldReservation),
                                                                    IntPtr.Zero);
                        }
                        finally
                        {
                            Marshal.FreeCoTaskMem(pInputConfigInfo);
                        }
                    });
            return retVal;
        }

        public static void ReserveURL(string networkURL, string securityDescriptor)
        {
            if (String.IsNullOrEmpty(networkURL))
                throw new ArgumentNullException("networkURL");
            if (String.IsNullOrEmpty(securityDescriptor))
                throw new ArgumentNullException("securityDescriptor");

            CallHttpApi(
                delegate
                    {
                        uint retVal;

                        HTTP_SERVICE_CONFIG_URLACL_KEY keyDesc = new HTTP_SERVICE_CONFIG_URLACL_KEY(networkURL);
                        HTTP_SERVICE_CONFIG_URLACL_PARAM paramDesc = new HTTP_SERVICE_CONFIG_URLACL_PARAM(securityDescriptor);

                        HTTP_SERVICE_CONFIG_URLACL_SET inputConfigInfoSet = new HTTP_SERVICE_CONFIG_URLACL_SET {KeyDesc = keyDesc, ParamDesc = paramDesc};

                        IntPtr pInputConfigInfo = Marshal.AllocCoTaskMem(Marshal.SizeOf(typeof(HTTP_SERVICE_CONFIG_URLACL_SET)));
                        Marshal.StructureToPtr(inputConfigInfoSet, pInputConfigInfo, false);
                        try
                        {
                            retVal = HttpSetServiceConfiguration(IntPtr.Zero,
                                                                 HTTP_SERVICE_CONFIG_ID.HttpServiceConfigUrlAclInfo,
                                                                 pInputConfigInfo,
                                                                 Marshal.SizeOf(inputConfigInfoSet),
                                                                 IntPtr.Zero);

                            if (ERROR_ALREADY_EXISTS == retVal)
                            {
                                retVal = DeleteReservation(networkURL);
                                if (ERROR_FILE_NOT_FOUND == retVal)
                                {
                                    string networkURLOld = networkURL.Contains("https") ? networkURL.Replace("https", "http") :
                                                               networkURL.Replace("http", "https");
                                    retVal = DeleteReservation(networkURLOld);
                                }

                                if (NOERROR == retVal)
                                {
                                    retVal = HttpSetServiceConfiguration(IntPtr.Zero,
                                                                         HTTP_SERVICE_CONFIG_ID.HttpServiceConfigUrlAclInfo,
                                                                         pInputConfigInfo,
                                                                         Marshal.SizeOf(inputConfigInfoSet),
                                                                         IntPtr.Zero);
                                }
                            }
                        }
                        finally
                        {
                            Marshal.FreeCoTaskMem(pInputConfigInfo);
                        }
                        if (NOERROR != retVal)
                            ThrowWin32ExceptionIfError(retVal);
                    });
        }
        #endregion

        private static void ThrowWin32ExceptionIfError(uint retVal)
        {
            if (NOERROR != retVal)
                throw new Win32Exception(Convert.ToInt32(retVal));
        }

        private static void CallHttpApi(Action body)
        {
            uint retVal = HttpInitialize(HttpApiVersion, HTTP_INITIALIZE_CONFIG, IntPtr.Zero);
            ThrowWin32ExceptionIfError(retVal);

            try
            {
                body();
            }
            finally
            {
                HttpTerminate(HTTP_INITIALIZE_CONFIG, IntPtr.Zero);
            }
        }

        /// <summary>
        ///     Creates an unmanaged sockaddr structure to pass to a WinAPI function.
        /// </summary>
        /// <param name="ipEndPoint">IP address and port number</param>
        /// <returns>a handle for the structure. Use the AddrOfPinnedObject Method to get a stable pointer to the object. </returns>
        /// <remarks>When the handle goes out of scope you must explicitly release it by calling the Free method; otherwise, memory leaks may occur. </remarks>
        private static GCHandle CreateSockaddrStructure(IPEndPoint ipEndPoint)
        {
            SocketAddress socketAddress = ipEndPoint.Serialize();

            // use an array of bytes instead of the sockaddr structure 
            byte[] sockAddrStructureBytes = new byte[socketAddress.Size];
            GCHandle sockAddrHandle = GCHandle.Alloc(sockAddrStructureBytes, GCHandleType.Pinned);
            for (int i = 0; i < socketAddress.Size; ++i)
                sockAddrStructureBytes[i] = socketAddress[i];
            return sockAddrHandle;
        }

        /// <summary>
        ///     Reads the unmanaged sockaddr structure returned by a WinAPI function
        /// </summary>
        /// <param name="pSockaddrStructure">pointer to the unmanaged sockaddr structure</param>
        /// <returns>IP address and port number</returns>
        private static IPEndPoint ReadSockaddrStructure(IntPtr pSockaddrStructure)
        {
            short sAddressFamily = Marshal.ReadInt16(pSockaddrStructure);
            AddressFamily addressFamily = (AddressFamily)sAddressFamily;

            int sockAddrSructureSize;
            IPEndPoint ipEndPointAny;
            switch (addressFamily)
            {
                case AddressFamily.InterNetwork:
                    // IP v4 address
                    sockAddrSructureSize = 16;
                    ipEndPointAny = new IPEndPoint(IPAddress.Any, 0);
                    break;
                case AddressFamily.InterNetworkV6:
                    // IP v6 address
                    sockAddrSructureSize = 28;
                    ipEndPointAny = new IPEndPoint(IPAddress.IPv6Any, 0);
                    break;
                default:
                    throw new ArgumentOutOfRangeException("pSockaddrStructure", "Unknown address family");
            }


            // get bytes of the sockadrr structure
            byte[] sockAddrSructureBytes = new byte[sockAddrSructureSize];
            Marshal.Copy(pSockaddrStructure, sockAddrSructureBytes, 0, sockAddrSructureSize);

            // create SocketAddress from bytes
            var socketAddress = new SocketAddress(AddressFamily.Unspecified, sockAddrSructureSize);
            for (int i = 0; i < sockAddrSructureSize; i++)
                socketAddress[i] = sockAddrSructureBytes[i];

            // create IPEndPoint from SocketAddress
            IPEndPoint result = (IPEndPoint)ipEndPointAny.Create(socketAddress);

            return result;
        }
    }
}