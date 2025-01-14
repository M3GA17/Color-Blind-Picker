using System.Reflection;
using WPFLocalizeExtension.Extensions;

namespace ColorBlindPicker.BusinessLayer.Helpers
{
    public static class LocalizationProvider
    {
        public static T GetLocalizedValue<T>(string key)
        {
            return LocExtension.GetLocalizedValue<T>
                (Assembly.GetCallingAssembly().GetName().Name + ":Localization:" + key);
        }
    }
}
