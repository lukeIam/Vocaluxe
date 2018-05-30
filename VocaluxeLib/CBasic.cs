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

namespace VocaluxeLib
{
    public static class CBase
    {
        public static IConfig Config { get; set; }
        public static ISettings Settings { get; set; }
        public static IThemes Themes { get; set; }
        public static IBackgroundMusic BackgroundMusic { get; set; }
        public static IDrawing Drawing { get; set; }
        public static IGraphics Graphics { get; set; }
        public static IFonts Fonts { get; set; }
        public static ILanguage Language { get; set; }
        public static IGame Game { get; set; }
        public static IProfiles Profiles { get; set; }
        public static IRecording Record { get; set; }
        public static ISongs Songs { get; set; }
        public static IVideo Video { get; set; }
        public static ISound Sound { get; set; }
        public static ICover Cover { get; set; }
        public static IDataBase DataBase { get; set; }
        public static IControllers Controller { get; set; }
        public static IPlaylist Playlist { get; set; }
    }
}