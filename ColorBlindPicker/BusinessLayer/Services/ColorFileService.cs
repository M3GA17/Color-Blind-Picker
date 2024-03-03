using ColorBlindPicker.ApplicationLayer.Models;
using ColorBlindPicker.ApplicationLayer.ViewModels;
using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;

namespace ColorBlindPicker.BusinessLayer.Services;

public class ColorFileService : BaseViewModel
{
    private ObservableCollection<ColorModel> colorList = [];

    public ObservableCollection<ColorModel> ColorsList
    {
        get { return colorList; }
        set
        {
            if (colorList != value)
            {
                colorList = value;
                OnPropertyChanged(nameof(ColorsList));
            }
        }
    }

    private const string FilePath = "colorList.txt";

    public ColorFileService() => ColorsList = LoadFromFile();

    public void AddColor(ColorModel color)
    {
        colorList.Add(color);
        SaveToFile();
    }

    public void RemoveColor(ColorModel color)
    {
        colorList.Remove(color);
        SaveToFile();
    }

    private void SaveToFile()
    {
        // Creare una lista di stringhe Hex dal colorList
        List<string> hexList = [];
        foreach (var color in colorList)
        {
            hexList.Add(color.Hex);
        }

        // Serializzare la lista di stringhe Hex
        string json = JsonSerializer.Serialize(hexList);
        File.WriteAllText(FilePath, json);
    }

    private static ObservableCollection<ColorModel> LoadFromFile()
    {
        try
        {
            if (File.Exists(FilePath))
            {
                string json = File.ReadAllText(FilePath) ?? string.Empty;
                List<string> hexList = JsonSerializer.Deserialize<List<string>>(json) ?? [];

                if (hexList != null)
                {
                    // Ricostruire la colorList utilizzando il costruttore con HexCode
                    ObservableCollection<ColorModel> loadedColors = [];
                    foreach (var hex in hexList)
                    {
                        loadedColors.Add(new ColorModel(hex));
                    }

                    return loadedColors;
                }
            }
            else
            {
                Console.WriteLine($"File not found: {FilePath}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred while loading the file: {ex.Message}");
        }

        return [];
    }
}