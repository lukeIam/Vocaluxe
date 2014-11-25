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
using System.Drawing;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Windows.Forms;
using ServerLib;
using ServerLib.DataTypes;
using Vocaluxe.Lib.Input;
using Vocaluxe.Lib.Playlist;
using VocaluxeLib;
using VocaluxeLib.Menu;
using VocaluxeLib.Profile;
using VocaluxeLib.Songs;

namespace Vocaluxe.Base.Server
{
    static class CVocaluxeServer
    {
        private class CServerController : CControllerFramework
        {
            public override string GetName()
            {
                return "App controller";
            }

            public override void Connect() { }

            public override void Disconnect() { }

            public override bool IsConnected()
            {
                return true;
            }

            public override void SetRumble(float duration) { }
        }

        private static CServer _Server;
        //private static CDiscover _Discover;

        public static readonly CControllerFramework Controller = new CServerController();

        public static void Init()
        {
            _Server = new CServer(CConfig.ServerPort, CConfig.ServerEncryption == EOffOn.TR_CONFIG_ON);

            CServer.SendKeyEvent = _SendKeyEvent;
            CServer.SendKeyStringEvent = _sendKeyStringEvent;
            CServer.GetProfileData = _GetProfileData;
            CServer.SendProfileData = _SendProfileData;
            CServer.GetProfileList = _GetProfileList;
            CServer.SendPhoto = _SendPhoto;
            CServer.GetSiteFile = _GetSiteFile;
            CServer.GetSong = _GetSong;
            CServer.GetAllSongs = _GetAllSongs;
            CServer.GetCurrentSongId = _GetCurrentSongId;
            CServer.ValidatePassword = _ValidatePassword;
            CServer.GetUserRole = _GetUserRole;
            CServer.SetUserRole = _SetUserRole;
            CServer.GetUserIdFromUsername = _GetUserIdFromUsername;
            CServer.GetDelayedImage = _GetDelayedImage;
            CServer.GetPlaylists = _GetPlaylists;
            CServer.GetPlaylist = _GetPlaylist;
            CServer.AddSongToPlaylist = _AddSongToPlaylist;
            CServer.RemoveSongFromPlaylist = _RemoveSongFromPlaylist;
            CServer.MoveSongInPlaylist = _MoveSongInPlaylist;
            CServer.PlaylistContainsSong = _PlaylistContainsSong;
            CServer.GetPlaylistSongs = _GetPlaylistSongs;
            CServer.RemovePlaylist = _RemovePlaylist;
            CServer.AddPlaylist = _AddPlaylist;

            CGame.SongChanged += (sender, @event) => _SongHasChanged(@event.Song != null ? @event.Song.ID : -1);
            //_Discover = new CDiscover(CConfig.ServerPort, CCommands.BroadcastKeyword);
        }

        public static void Start()
        {
            if (CConfig.ServerActive == EOffOn.TR_CONFIG_ON)
            {
                _Server.Start();
                //_Discover.StartBroadcasting();
            }
        }

        public static void Close()
        {
            if (_Server != null)
            {
                _Server.Stop();
                _Server = null;
                //_Discover.Stop();
            }
        }

        public static string GetServerAddress()
        {
            return _Server == null ? "" : _Server.GetBaseAddress();
        }

        public static bool IsServerRunning()
        {
            if (_Server == null)
                return false;

            return _Server.IsRunning();
        }

        private static bool _SendKeyEvent(string key)
        {
            bool result = false;
            var lowerKey = key.ToLower();

            if (!string.IsNullOrEmpty(lowerKey))
            {
                switch (lowerKey)
                {
                    case "up":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Up));
                        result = true;
                        break;
                    case "down":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Down));
                        result = true;
                        break;
                    case "left":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Left));
                        result = true;
                        break;
                    case "right":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Right));
                        result = true;
                        break;
                    case "escape":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Escape));
                        result = true;
                        break;
                    case "return":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Return));
                        result = true;
                        break;
                    case "tab":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Tab));
                        result = true;
                        break;
                    case "backspace":
                        Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, Keys.Back));
                        result = true;
                        break;
                    default:
                        if (lowerKey.StartsWith("f"))
                        {
                            var numberString = lowerKey.Substring(1);
                            int number;
                            Keys fKey;

                            if (Int32.TryParse(numberString, out number) && number >= 1
                                && number <= 12
                                && Enum.TryParse("F" + number, true, out fKey))
                            {
                                Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, false, false, false, false, Char.MinValue, fKey));
                                result = true;
                            }
                        }
                        break;
                }
            }

            return result;
        }

        private static bool _sendKeyStringEvent(string keyString, bool isShiftPressed, bool isAltPressed, bool isCtrlPressed)
        {
            bool result = false;

            foreach (var key in keyString.ToCharArray())
            {
                Controller.AddKeyEvent(new SKeyEvent(ESender.Keyboard, isAltPressed,
                    Char.IsUpper(key) || isShiftPressed,
                    isCtrlPressed, true,
                    isShiftPressed ? Char.ToUpper(key) : key,
                    _ParseKeys(key)));
                result = true;
            }

            return result;
        }

        private static Keys _ParseKeys(char keyText)
        {
            Keys key;

            if (!Enum.TryParse(keyText.ToString(), true, out key))
            {
                switch (keyText)
                {
                    case ' ':
                        key = Keys.Space;
                        break;
                    default:
                        key = Keys.None;
                        break;
                }
            }

            return key;
        }

        #region profile
        private static SProfileData _GetProfileData(int profileId, bool isReadonly)
        {
            CProfile profile = CProfiles.GetProfile(profileId);
            if (profile == null)
                return new SProfileData();
            return _CreateProfileData(profile, isReadonly);
        }

        private static bool _SendProfileData(SProfileData profile)
        {
            CProfile newProfile;
            CProfile existingProfile = CProfiles.GetProfile(profile.ProfileId);

            if (existingProfile != null)
            {
                newProfile = new CProfile
                {
                    ID = existingProfile.ID,
                    FileName = existingProfile.FileName,
                    Active = existingProfile.Active,
                    Avatar = existingProfile.Avatar,
                    Difficulty = existingProfile.Difficulty,
                    UserRole = existingProfile.UserRole,
                    PlayerName = existingProfile.PlayerName
                };
            }
            else
            {
                newProfile = new CProfile
                {
                    Active = EOffOn.TR_CONFIG_ON,
                    UserRole = EUserRole.TR_USERROLE_NORMAL
                };
            }

            if (profile.Avatar != null)
                newProfile.Avatar = _AddAvatar(profile.Avatar);
            else if (newProfile.Avatar == null || newProfile.Avatar.ID == -1)
            {
                newProfile.Avatar = CProfiles.GetAvatars().First();

                /*CAvatar avatar = new CAvatar(-1);
                avatar.LoadFromFile("Profiles\\Avatar_f.png");
                CProfiles.AddAvatar(avatar);
                newProfile.Avatar = avatar;*/
            }

            if (!string.IsNullOrEmpty(profile.PlayerName))
                newProfile.PlayerName = profile.PlayerName;
            else if (!string.IsNullOrEmpty(newProfile.PlayerName))
                newProfile.PlayerName = "DummyName";

            if (profile.Difficulty >= 0 && profile.Difficulty <= 2)
                newProfile.Difficulty = (EGameDifficulty)profile.Difficulty;

            if (profile.Type >= 0 && profile.Type <= 1)
            {
                EUserRole option = profile.Type == 0 ? EUserRole.TR_USERROLE_GUEST : EUserRole.TR_USERROLE_NORMAL;
                //Only allow the change of TR_USERROLE_GUEST and TR_USERROLE_NORMAL
                const EUserRole mask = EUserRole.TR_USERROLE_NORMAL;
                newProfile.UserRole = (newProfile.UserRole & mask) | option;
            }

            if (!string.IsNullOrEmpty(profile.Password))
            {
                if (profile.Password == "***__CLEAR_PASSWORD__***")
                {
                    newProfile.PasswordSalt = null;
                    newProfile.PasswordHash = null;
                }
                else
                {
                    RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider();
                    byte[] buffer = new byte[32];
                    rng.GetNonZeroBytes(buffer);
                    byte[] salt = buffer;
                    byte[] hashedPassword = _Hash((new UTF8Encoding()).GetBytes(profile.Password), salt);

                    newProfile.PasswordSalt = salt;
                    newProfile.PasswordHash = hashedPassword;
                }
            }

            if (existingProfile != null)
            {
                CProfiles.EditProfile(newProfile);
                CProfiles.Update();
                CProfiles.SaveProfiles();
            }
            else
                CProfiles.AddProfile(newProfile);

            return true;
        }

        private static SProfileData[] _GetProfileList()
        {
            List<SProfileData> result = new List<SProfileData>(CProfiles.NumProfiles);

            result.AddRange(CProfiles.GetProfiles().Select(profile => _CreateProfileData(profile, true)));

            return result.ToArray();
        }

        private static SProfileData _CreateProfileData(CProfile profile, bool isReadonly)
        {
            SProfileData profileData = new SProfileData
            {
                IsEditable = !isReadonly,
                ProfileId = profile.ID,
                PlayerName = profile.PlayerName,
                //Is TR_USERROLE_GUEST or TR_USERROLE_NORMAL?
                Type = (profile.UserRole.HasFlag(EUserRole.TR_USERROLE_NORMAL) ? 1 : 0),
                Difficulty = (int)profile.Difficulty
            };

            CAvatar avatar = profile.Avatar;
            if (avatar != null)
            {
                if (File.Exists(avatar.FileName))
                    profileData.Avatar = new CBase64Image(_CreateDelayedImage(avatar.FileName));
            }
            return profileData;
        }

        private static CAvatar _AddAvatar(CBase64Image avatarData)
        {
            try
            {
                string filename = _SaveImage(avatarData, "snapshot", CConfig.ProfileFolders[0]);

                CAvatar avatar = CAvatar.GetAvatar(filename);
                if (avatar != null)
                {
                    CProfiles.AddAvatar(avatar);
                    return avatar;
                }
                return null;
            }
            catch
            {
                return null;
            }
        }
        #endregion

        #region photo
        private static readonly List<string> _PhotosOfThisRound = new List<string>();

        private static bool _SendPhoto(SPhotoData photoData)
        {
            if (photoData.Photo == null)
                return false;

            string name = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
            string filePath = _SaveImage(photoData.Photo, name, CSettings.FolderNamePhotos);
            if (!string.IsNullOrEmpty(filePath))
            {
                _PhotosOfThisRound.Add(filePath);
                return true;
            }

            return false;
        }

        internal static string[] GetPhotosOfThisRound()
        {
            string[] result = _PhotosOfThisRound.ToArray();
            _PhotosOfThisRound.Clear();
            return result;
        }
        #endregion

        #region website
        private static readonly Dictionary<string, string> _DelayedImagePath = new Dictionary<string, string>();

        private static byte[] _GetSiteFile(string filename)
        {
            string path = "Website/" + filename;
            path = path.Replace("..", "");

            if (!File.Exists(path))
                return null;

            /*string content = File.ReadAllText(path);

            content = content.Replace("%SERVER%", System.Net.Dns.GetHostName() + ":" + CConfig.ServerPort);


            return Encoding.UTF8.GetBytes(content);*/

            return File.ReadAllBytes(path);
        }

        private static string _CreateDelayedImage(string filename)
        {
            byte[] by = SHA1.Create().ComputeHash(Encoding.UTF8.GetBytes(filename));
            var sb = new StringBuilder();
            foreach (byte b in by)
                sb.Append(b.ToString("x2"));

            string hashedFilename = sb.ToString();

            if (!_DelayedImagePath.ContainsKey(hashedFilename))
                _DelayedImagePath.Add(hashedFilename, filename);
            return hashedFilename;
        }

        private static CBase64Image _GetDelayedImage(string hashedFilename)
        {
            if (!_DelayedImagePath.ContainsKey(hashedFilename))
                throw new FileNotFoundException("Image not found");

            string fileName = _DelayedImagePath[hashedFilename];

            if (File.Exists(fileName))
            {
                Image image = Image.FromFile(fileName);
                return new CBase64Image(image, image.RawFormat);
            }
            throw new FileNotFoundException("Image not found");
        }
        #endregion

        #region songs
        private static SSongInfo _GetSong(int songId)
        {
            CSong song = CSongs.GetSong(songId);
            return _GetSongInfo(song, true);
        }

        private static SSongInfo[] _GetAllSongs()
        {
            List<CSong> songs = CSongs.Songs;
            return (from s in songs
                    select _GetSongInfo(s, false)).ToArray<SSongInfo>();
        }

        private static int _GetCurrentSongId()
        {
            CSong song = CGame.GetSong();
            if (song == null)
                return -1;
            return song.ID;
        }

        private static SSongInfo _GetSongInfo(CSong song, bool includeCover)
        {
            SSongInfo result = new SSongInfo();
            if (song != null)
            {
                result.Title = song.Title;
                result.Artist = song.Artist;
                result.Genre = song.Genres.FirstOrDefault();
                result.Language = song.Languages.FirstOrDefault();
                result.Year = song.Year;
                result.IsDuet = song.IsDuet;
                result.SongId = song.ID;
                if (includeCover)
                    result.Cover = new CBase64Image(_CreateDelayedImage(song.Folder + "\\" + song.CoverFileName));
            }
            return result;
        }

        private static void _SongHasChanged(int songId)
        {
            CPlayerCommunication.AddNewPlayerMessage(EPlayerComunicationType.SongChanged, new CPlayerComunicationDataInt() { Value = songId });
        }

        #endregion

        #region playlist
        private static SPlaylistInfo[] _GetPlaylists()
        {
            return (from p in CPlaylists.Playlists
                    select _GetPlaylistInfo(p)).ToArray();
        }

        private static SPlaylistInfo _GetPlaylist(int playlistId)
        {
            if (CPlaylists.Get(playlistId) == null)
                throw new ArgumentException("invalid playlistId");
            return _GetPlaylistInfo(CPlaylists.Get(playlistId));
        }

        private static void _AddSongToPlaylist(int songId, int playlistId, bool allowDuplicates)
        {
            if (CPlaylists.Get(playlistId) == null)
                throw new ArgumentException("invalid playlistId");

            if (allowDuplicates || !_PlaylistContainsSong(songId, playlistId))
            {
                CPlaylists.AddSong(playlistId, songId);
                CPlaylists.Save(playlistId);
            }
            else
                throw new ArgumentException("song exists in this playlist");
        }

        private static void _RemoveSongFromPlaylist(int position, int playlistId, int songId)
        {
            CPlaylistFile pl = CPlaylists.Get(playlistId);
            if (pl == null)
                throw new ArgumentException("invalid playlistId");
            if (!_PlaylistContainsSong(songId, playlistId))
                throw new ArgumentException("invalid songId");
            if (position < 0 || pl.Songs.Count <= position
                || pl.Songs[position].SongID != songId)
                throw new ArgumentException("invalid position");
            pl.DeleteSong(position);
            pl.Save();
        }

        private static void _MoveSongInPlaylist(int newPosition, int playlistId, int songId)
        {
            CPlaylistFile pl = CPlaylists.Get(playlistId);
            if (pl == null)
                throw new ArgumentException("invalid playlistId");
            if (!_PlaylistContainsSong(songId, playlistId))
                throw new ArgumentException("invalid songId");

            if (pl.Songs.Count < newPosition)
                throw new ArgumentException("invalid newPosition");

            int oldPosition = pl.Songs.FindIndex(s => s.SongID == songId);
            pl.MoveSong(oldPosition, newPosition);
            pl.Save();
        }

        private static bool _PlaylistContainsSong(int songId, int playlistId)
        {
            CPlaylistFile pl = CPlaylists.Get(playlistId);
            if (pl == null)
                throw new ArgumentException("invalid playlistId");
            return pl.Songs.Any(s => s.SongID == songId);
        }

        private static SPlaylistSongInfo[] _GetPlaylistSongs(int playlistId)
        {
            CPlaylistFile pl = CPlaylists.Get(playlistId);
            if (pl == null)
                throw new ArgumentException("invalid playlistId");

            return _GetPlaylistSongInfos(pl);
        }

        private static SPlaylistSongInfo _GetPlaylistSongInfo(CPlaylistSong playlistSong, int playlistId, int playlistPos)
        {
            SPlaylistSongInfo result = new SPlaylistSongInfo();
            if (playlistSong != null)
            {
                result.PlaylistId = playlistId;
                result.GameMode = (int)playlistSong.GameMode;
                result.PlaylistPosition = playlistPos;
                result.Song = _GetSongInfo(CSongs.GetSong(playlistSong.SongID), true);
            }
            return result;
        }

        private static SPlaylistSongInfo[] _GetPlaylistSongInfos(CPlaylistFile playlist)
        {
            SPlaylistSongInfo[] result = new SPlaylistSongInfo[playlist.Songs.Count];
            for (int i = 0; i < playlist.Songs.Count; i++)
                result[i] = _GetPlaylistSongInfo(playlist.Songs[i], playlist.Id, i);
            return result;
        }

        private static SPlaylistInfo _GetPlaylistInfo(CPlaylistFile playlist)
        {
            return new SPlaylistInfo
            {
                PlaylistId = playlist.Id,
                PlaylistName = playlist.Name,
                SongCount = playlist.Songs.Count,
                LastChanged = DateTime.Now.ToLongDateString()
            };
        }

        private static void _RemovePlaylist(int playlistId)
        {
            if (CPlaylists.Get(playlistId) == null)
                throw new ArgumentException("invalid playlistId");
            CPlaylists.Delete(playlistId);
        }

        private static int _AddPlaylist(string playlistName)
        {
            int newPlaylistId = CPlaylists.NewPlaylist(playlistName);
            CPlaylists.Save(newPlaylistId);

            return newPlaylistId;
        }

        #endregion

        #region user management
        private static bool _ValidatePassword(int profileId, string password)
        {
            CProfile profile = CProfiles.GetProfile(profileId);
            if (profile == null)
                throw new ArgumentException("Invalid profileId");

            if (profile.PasswordHash == null)
            {
                if (string.IsNullOrEmpty(password))
                    return true; //Allow emty passwords
                return false;
            }

            byte[] salt = profile.PasswordSalt;
            return _Hash((new UTF8Encoding()).GetBytes(password), salt).SequenceEqual(profile.PasswordHash);
        }

        private static bool _ValidatePassword(int profileId, byte[] hashedPassword)
        {
            CProfile profile = CProfiles.GetProfile(profileId);
            if (profile == null)
                throw new ArgumentException("Invalid profileId");

            if (profile.PasswordHash == null)
            {
                if (hashedPassword == null)
                    return true; //Allow emty passwords
                return false;
            }

            //byte[] salt = profile.PasswordSalt;
            return hashedPassword.SequenceEqual(profile.PasswordHash);
        }

        private static byte[] _GetPasswordSalt(int profileId)
        {
            CProfile profile = CProfiles.GetProfile(profileId);
            if (profile == null)
                throw new ArgumentException("Invalid profileId");

            if (profile.PasswordHash == null)
                throw new ArgumentException("Emty password");

            return profile.PasswordSalt;
        }

        private static int _GetUserRole(int profileId)
        {
            CProfile profile = CProfiles.GetProfile(profileId);
            if (profile == null)
                throw new ArgumentException("Invalid profileId");

            //Hide TR_USERROLE_GUEST and TR_USERROLE_NORMAL
            //const EUserRole mask = (EUserRole.TR_USERROLE_GUEST | EUserRole.TR_USERROLE_NORMAL);

            return (int)(profile.UserRole);
        }

        private static void _SetUserRole(int profileId, int userRole)
        {
            CProfile profile = CProfiles.GetProfile(profileId);
            if (profile == null)
                throw new ArgumentException("Invalid profileId");

            var option = (EUserRole)userRole;

            //Only allow the change of all options exept TR_USERROLE_GUEST and TR_USERROLE_NORMAL
            const EUserRole mask = (EUserRole.TR_USERROLE_GUEST | EUserRole.TR_USERROLE_NORMAL);
            option &= ~mask;

            profile.UserRole = (profile.UserRole & mask) | option;

            CProfiles.EditProfile(profile);
            CProfiles.Update();
            CProfiles.SaveProfiles();
        }

        private static int _GetUserIdFromUsername(string username)
        {
            IEnumerable<int> playerIds = (from p in CProfiles.GetProfiles()
                                          where String.Equals(p.PlayerName, username, StringComparison.OrdinalIgnoreCase)
                                          select p.ID);
            if (!playerIds.Any())
                throw new ArgumentException("Invalid playername");

            return playerIds.First();
        }

        private static byte[] _Hash(byte[] password, byte[] salt)
        {
            HashAlgorithm hashAlgo = new SHA256Managed();

            byte[] data = new byte[password.Length + salt.Length];

            password.CopyTo(data, 0);
            salt.CopyTo(data, password.Length);

            return hashAlgo.ComputeHash(data);
        }
        #endregion

        private static string _SaveImage(CBase64Image imageDate, string name, string folder)
        {
            Image avatarImage = imageDate.GetImage();
            string extension = imageDate.GetImageType();

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string file = CHelper.GetUniqueFileName(folder, name + "." + extension);

            avatarImage.Save(file);
            return file;
        }
    }
}