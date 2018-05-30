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

using System.Diagnostics;
using System.Xml.Serialization;
using VocaluxeLib.Draw;

namespace VocaluxeLib.Menu
{
    [XmlType("Button")]
    public struct SThemeButton
    {
        [XmlAttribute(AttributeName = "Name")] public string Name;
        public string Skin;
        public string SkinSelected;
        public SRectF Rect;
        public SThemeColor Color;
        public SThemeColor SelColor;
        public SThemeText Text;
        public SThemeText? SelText;
        public SReflection? Reflection;
        public SReflection? SelReflection;
    }

    public sealed class CButton : CMenuElementBase, IMenuElement, IThemeable
    {
        private SThemeButton _Theme;
        private readonly int _PartyModeID;

        public CTextureRef Texture { get; set; }
        private readonly CTextureRef _SelTexture;
        private SColorF _Color;
        public SColorF Color
        {
            get => _Color;
            set => _Color = value;
        }
        private SColorF _SelColor;
        public SColorF SelColor
        {
            get => _SelColor;
            set => _SelColor = value;
        }

        public CText Text { get; set; }
        private CText _SelText;

        private bool _Reflection;
        private float _ReflectionSpace;
        private float _ReflectionHeight;

        private bool _SelReflection;
        private float _SelReflectionSpace;
        private float _SelReflectionHeight;

        public bool Pressed { get; set; }

        public bool EditMode
        {
            get => Text.EditMode;
            set
            {
                Text.EditMode = value;
                if (_SelText != null)
                    _SelText.EditMode = value;
            }
        }

        public override bool Selected
        {
            get => base.Selected;
            set
            {
                base.Selected = value;
                Text.Selected = value;
            }
        }
        private bool _Selectable = true;

        public bool Selectable
        {
            get => _Selectable && Visible;
            set
            {
                _Selectable = value;
                if (!_Selectable)
                    Selected = false;
            }
        }

        public string GetThemeName()
        {
            return _Theme.Name;
        }

        public bool ThemeLoaded { get; private set; }

        public CButton(int partyModeID)
        {
            _PartyModeID = partyModeID;
            Text = new CText(_PartyModeID);
            _SelText = new CText(_PartyModeID);
            Selected = false;
            EditMode = false;
        }

        public CButton(SThemeButton theme, int partyModeID, bool buttonText = false)
        {
            _PartyModeID = partyModeID;
            _Theme = theme;

            Text = new CText(_Theme.Text, _PartyModeID, buttonText);
            _SelText = _Theme.SelText.HasValue ? new CText(_Theme.SelText.Value, _PartyModeID, buttonText) : null;

            Selected = false;
            EditMode = false;

            ThemeLoaded = true;
        }

        public CButton(CButton button)
        {
            _PartyModeID = button._PartyModeID;
            _Theme = new SThemeButton
                {
                    Skin = button._Theme.Skin,
                    SkinSelected = button._Theme.SkinSelected
                };

            MaxRect = button.MaxRect;
            Color = button.Color;
            _SelColor = button._SelColor;
            Texture = button.Texture;
            _SelTexture = button._SelTexture;

            Text = new CText(button.Text);
            _SelText = _SelText == null ? null : new CText(button._SelText);
            Selected = false;
            EditMode = false;
            _Selectable = button._Selectable;

            _Reflection = button._Reflection;
            _ReflectionHeight = button._ReflectionHeight;
            _ReflectionSpace = button._ReflectionSpace;

            _SelReflection = button._SelReflection;
            _SelReflectionHeight = button._SelReflectionHeight;
            _SelReflectionSpace = button._SelReflectionSpace;
        }

        private void _ReadSubThemeElements()
        {
            _Theme.Text = (SThemeText)Text.GetTheme();
            if (_SelText == null)
                _Theme.SelText = null;
            else
                _Theme.SelText = (SThemeText)_SelText.GetTheme();
        }

        public void Draw()
        {
            if (!Visible && CBase.Settings.GetProgramState() != EProgramState.EditTheme)
                return;

            CTextureRef texture;

            if (!Selected && !Pressed || !_Selectable)
            {
                texture = Texture ?? CBase.Themes.GetSkinTexture(_Theme.Skin, _PartyModeID);

                CBase.Drawing.DrawTexture(texture, Rect, Color);

                if (_Reflection)
                {
                    CBase.Drawing.DrawTextureReflection(texture, Rect, Color, Rect, _ReflectionSpace, _ReflectionHeight);
                    Text.DrawRelative(Rect.X, Rect.Y, _ReflectionHeight, _ReflectionSpace, Rect.H);
                }
                else
                    Text.DrawRelative(Rect.X, Rect.Y);
            }
            else if (_SelText == null)
            {
                texture = _SelTexture ?? CBase.Themes.GetSkinTexture(_Theme.SkinSelected, _PartyModeID);

                CBase.Drawing.DrawTexture(texture, Rect, _SelColor);

                if (_Reflection)
                {
                    CBase.Drawing.DrawTextureReflection(texture, Rect, _SelColor, Rect, _ReflectionSpace, _ReflectionHeight);
                    Text.DrawRelative(Rect.X, Rect.Y, _ReflectionHeight, _ReflectionSpace, Rect.H);
                }
                else
                    Text.DrawRelative(Rect.X, Rect.Y);
            }
            else
            {
                texture = _SelTexture ?? CBase.Themes.GetSkinTexture(_Theme.SkinSelected, _PartyModeID);

                CBase.Drawing.DrawTexture(texture, Rect, _SelColor);

                if (_Reflection)
                {
                    CBase.Drawing.DrawTextureReflection(texture, Rect, _SelColor, Rect, _ReflectionSpace, _ReflectionHeight);
                    _SelText.DrawRelative(Rect.X, Rect.Y, _ReflectionHeight, _ReflectionSpace, Rect.H);
                }
                else
                    _SelText.DrawRelative(Rect.X, Rect.Y);
            }
        }

        public void UnloadSkin()
        {
            if (!ThemeLoaded)
                return;
            Text.UnloadSkin();
        }

        public void LoadSkin()
        {
            if (!ThemeLoaded)
                return;
            Text = new CText(_Theme.Text, _PartyModeID);
            Text.LoadSkin();
            Text.Selected = Selected;

            if (_Theme.SelText.HasValue)
            {
                _SelText = new CText(_Theme.SelText.Value, _PartyModeID);
                _SelText.LoadSkin();
            }

            _Theme.Color.Get(_PartyModeID, out _Color);
            _Theme.SelColor.Get(_PartyModeID, out _SelColor);

            MaxRect = _Theme.Rect;

            _Reflection = _Theme.Reflection.HasValue;
            if (_Reflection)
            {
                Debug.Assert(_Theme.Reflection != null);
                _ReflectionHeight = _Theme.Reflection.Value.Height;
                _ReflectionSpace = _Theme.Reflection.Value.Space;
            }

            _SelReflection = _Theme.Reflection.HasValue;
            if (_SelReflection)
            {
                Debug.Assert(_Theme.SelReflection != null);
                _SelReflectionHeight = _Theme.SelReflection.Value.Height;
                _SelReflectionSpace = _Theme.SelReflection.Value.Space;
            }

            if (_Theme.Rect.Z < Text.Z)
                Text.Z = _Theme.Rect.Z;
        }

        public void ReloadSkin()
        {
            UnloadSkin();
            LoadSkin();
        }

        public object GetTheme()
        {
            _ReadSubThemeElements();
            return _Theme;
        }

        #region ThemeEdit
        public void MoveElement(int stepX, int stepY)
        {
            X += stepX;
            Y += stepY;

            _Theme.Rect.X += stepX;
            _Theme.Rect.Y += stepY;
        }

        public void ResizeElement(int stepW, int stepH)
        {
            W += stepW;
            if (W <= 0)
                W = 1;

            H += stepH;
            if (H <= 0)
                H = 1;

            _Theme.Rect.W = Rect.W;
            _Theme.Rect.H = Rect.H;
        }
        #endregion ThemeEdit
    }
}