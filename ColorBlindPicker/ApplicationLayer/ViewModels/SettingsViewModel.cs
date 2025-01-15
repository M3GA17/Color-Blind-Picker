using ColorBlindPicker.ApplicationLayer.Enums;

namespace ColorBlindPicker.ApplicationLayer.ViewModels;

public class SettingsViewModel : BaseViewModel
{
    public static List<string> ListOfLanguage => [.. Enum.GetNames(typeof(Languages))];

    public SettingsViewModel()
    {
    }
}
